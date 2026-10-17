"use client";

/* Booking alerts on the dashboard.
 *
 * Two channels, one feed:
 *  - While a dashboard tab is open, the alert feed is polled and new alerts
 *    pop as toasts (works with no permissions at all).
 *  - With browser alerts switched on, the service worker (public/sw.js)
 *    receives Web Push even when the tab is closed. If a dashboard tab is
 *    focused it forwards the push here instead of showing a system banner.
 * Toasts are keyed by alert id, so a push and a poll never show twice.
 */

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useBusiness } from "./business-context";

export type Alert = {
  id: string;
  title: string;
  detail: string;
  body: string;
  kind: string;
  topic: string;
  created_at: string;
};

type Toast = { id: string; title: string; body: string; kind: string; url: string };
export type PushState = "checking" | "unsupported" | "unavailable" | "denied" | "off" | "on" | "busy";

type Ctx = {
  alerts: Alert[];
  unread: number;
  markRead: () => void;
  push: PushState;
  pushError: string | null;
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
  sendTest: () => Promise<string>;
  urlFor: (kind: string) => string;
};

const AlertsCtx = createContext<Ctx | null>(null);
const SEEN_KEY = "footfall.alertsSeenAt";
const POLL_MS = 20_000;
const TOAST_MS = 9_000;

const urlFor = (kind: string) =>
  kind === "needs_owner" || kind === "agent_failed" ? "/dashboard/inbox" : "/dashboard/bookings";

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function browserLabel(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "Linux";
  return `${browser} on ${os}`;
}

function readSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY) || 0);
  } catch {
    return 0;
  }
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { business } = useBusiness();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [seenAt, setSeenAt] = useState<number>(0);
  const [push, setPush] = useState<PushState>("checking");
  const [pushError, setPushError] = useState<string | null>(null);
  const shown = useRef<Set<string>>(new Set());
  const cursor = useRef<string | null>(null);
  const vapidKey = useRef<string | null>(null);

  useEffect(() => setSeenAt(readSeen()), []);

  const toast = useCallback((t: Toast) => {
    if (!t.id || shown.current.has(t.id)) return;
    shown.current.add(t.id);
    setToasts((all) => [...all.slice(-3), t]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== t.id)), TOAST_MS);
  }, []);

  // Feed: first load fills the list silently; later polls toast what's new.
  const poll = useCallback(async () => {
    if (!business) return;
    const since = cursor.current ? `?since=${encodeURIComponent(cursor.current)}` : "";
    let rows: Alert[];
    try {
      rows = await api<Alert[]>(`businesses/${business.id}/alerts${since}`);
    } catch {
      return;
    }
    if (!rows.length) return;
    const firstLoad = cursor.current === null;
    cursor.current = rows[0].created_at;
    setAlerts((prev) => {
      const known = new Set(prev.map((a) => a.id));
      return [...rows.filter((a) => !known.has(a.id)), ...prev].slice(0, 30);
    });
    if (firstLoad) {
      rows.forEach((a) => shown.current.add(a.id));
      return;
    }
    rows
      .slice()
      .reverse()
      .forEach((a) => toast({ id: a.id, title: a.title, body: a.detail, kind: a.kind, url: urlFor(a.kind) }));
  }, [business, toast]);

  useEffect(() => {
    cursor.current = null;
    setAlerts([]);
    poll();
    const tick = () => {
      if (document.visibilityState === "visible") poll();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [poll]);

  // Pushes that arrive while this tab is focused come here from sw.js.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const d = event.data;
      if (d?.type !== "footfall-alert") return;
      toast({ id: d.id, title: d.title, body: d.body, kind: d.kind ?? "", url: d.url });
      poll();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [toast, poll]);

  const register = useCallback(async (sub: PushSubscription) => {
    const json = sub.toJSON();
    await api("devices", {
      method: "PUT",
      body: JSON.stringify({ platform: "web", token: sub.endpoint, keys: json.keys, label: browserLabel() }),
    });
  }, []);

  // Work out where push stands; re-register an existing subscription so the
  // server keeps it fresh (and it follows whoever is signed in now).
  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setPush("unsupported");
        return;
      }
      try {
        const cfg = await api<{ vapid_public_key: string | null }>("push-config");
        vapidKey.current = cfg.vapid_public_key;
      } catch {
        vapidKey.current = null;
      }
      if (!vapidKey.current) {
        setPush("unavailable");
        return;
      }
      if (Notification.permission === "denied") {
        setPush("denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === "granted") {
        await register(sub).catch(() => {});
        setPush("on");
      } else {
        setPush("off");
      }
    })();
  }, [register]);

  const enablePush = useCallback(async () => {
    setPushError(null);
    if (!vapidKey.current) return;
    setPush("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey.current) }));
      await register(sub);
      setPush("on");
    } catch (e) {
      setPushError((e as Error).message);
      setPush("off");
    }
  }, [register]);

  const disablePush = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await api(`devices?token=${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
    setPush((p) => (p === "on" ? "off" : p));
  }, []);

  const sendTest = useCallback(async () => {
    const r = await api<{ devices: number; sent: number; reason: string | null }>("devices/test", { method: "POST" });
    if (r.sent) return `Sent to ${r.sent} device${r.sent === 1 ? "" : "s"}.`;
    if (!r.devices) return "No devices are set up for alerts yet.";
    return `Couldn't deliver${r.reason ? ` — ${r.reason}` : ""}.`;
  }, []);

  const markRead = useCallback(() => {
    const now = Date.now();
    setSeenAt(now);
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch {}
  }, []);

  const unread = alerts.filter((a) => new Date(a.created_at).getTime() > seenAt).length;

  return (
    <AlertsCtx.Provider value={{ alerts, unread, markRead, push, pushError, enablePush, disablePush, sendTest, urlFor }}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <button
            key={t.id}
            className={`toast k-${t.kind || "info"}`}
            onClick={() => {
              setToasts((all) => all.filter((x) => x.id !== t.id));
              router.push(t.url);
            }}
          >
            <img src="/logo/notify-icon.png" alt="" />
            <span>
              <b>{t.title}</b>
              <em>{t.body}</em>
            </span>
          </button>
        ))}
      </div>
    </AlertsCtx.Provider>
  );
}

export function useAlerts(): Ctx {
  const ctx = useContext(AlertsCtx);
  if (!ctx) throw new Error("useAlerts must be used inside AlertsProvider");
  return ctx;
}
