"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAlerts } from "@/lib/alerts";

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const PUSH_COPY: Record<string, string> = {
  unsupported: "This browser can't show alerts — you'll still see them here while the dashboard is open.",
  unavailable: "Browser alerts are being set up — you'll still see them here while the dashboard is open.",
  denied: "Alerts are blocked for this site. Allow notifications in the browser's site settings, then reload.",
  off: "Get a notification for every booking and cancellation, even with this tab closed.",
};

export function AlertsBell() {
  const { alerts, unread, markRead, push, pushError, enablePush, disablePush, sendTest, urlFor } = useAlerts();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="bell" ref={ref}>
      <button
        className="bell-btn"
        aria-label={unread ? `${unread} new alerts` : "Alerts"}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markRead();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9ZM10.3 20a2 2 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && <span className="bell-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="dialog" aria-label="Alerts">
          <div className="bell-head">
            <b>Alerts</b>
            {push === "on" && (
              <span className="bell-on">
                Browser alerts on ·{" "}
                <a onClick={async () => setTestMsg(await sendTest())}>test</a> ·{" "}
                <a onClick={disablePush}>turn off</a>
              </span>
            )}
          </div>
          {testMsg && <p className="bell-note">{testMsg}</p>}

          {push !== "on" && push !== "checking" && (
            <div className="bell-cta">
              <p>{PUSH_COPY[push === "busy" ? "off" : push]}</p>
              {(push === "off" || push === "busy") && (
                <button className="btn" onClick={enablePush} disabled={push === "busy"}>
                  {push === "busy" ? "Turning on…" : "Turn on booking alerts"}
                </button>
              )}
              {pushError && <p className="bell-err">{pushError}</p>}
            </div>
          )}

          <div className="bell-list">
            {alerts.length === 0 ? (
              <p className="bell-empty">Nothing yet. New bookings, moves and cancellations show up here.</p>
            ) : (
              alerts.slice(0, 12).map((a) => (
                <button
                  key={a.id}
                  className={`bell-item k-${a.kind}`}
                  onClick={() => {
                    setOpen(false);
                    router.push(urlFor(a.kind));
                  }}
                >
                  <i aria-hidden="true" />
                  <span>
                    <b>{a.title}</b>
                    <em>{a.detail}</em>
                    <small>{ago(a.created_at)}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
