"use client";

/* Settings cards: link the business's Google listing (one business per
   listing, same rule as sign-up), and browser booking alerts. */

import { useEffect, useRef, useState } from "react";
import { api, ApiError, type Me } from "@/lib/api";
import { useAlerts } from "@/lib/alerts";
import { useBusiness } from "@/lib/business-context";
import { Icon } from "../ui";

type Suggestion = { place_id: string; name: string; secondary: string | null };
type Listing = {
  place_id: string;
  name: string;
  address: string | null;
  claimed: boolean;
  business_id: string | null;
  business_name: string | null;
};

const VERIFY_COPY: Record<string, { label: string; cls: string; note: string }> = {
  verified: { label: "Verified", cls: "confirmed", note: "This business is confirmed as yours." },
  pending_review: {
    label: "Pending check",
    cls: "human",
    note: "The listing's phone doesn't match your verified number yet — we'll confirm with a quick call, or connect your WhatsApp number from that listing.",
  },
  unverified: { label: "Not verified", cls: "off", note: "Link your Google listing so customers and we know this is really you." },
};

export function ListingCard() {
  const { business, refresh } = useBusiness();
  const [me, setMe] = useState<Me | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [listing, setListing] = useState<Listing | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const session = useRef(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

  useEffect(() => {
    api<Me>("me").then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (listing || q.trim().length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api<Suggestion[]>(`places/search?q=${encodeURIComponent(q)}&session=${session.current}`)
        .then(setResults)
        .catch((e) => setMsg({ text: (e as Error).message, error: true }));
    }, 300);
    return () => clearTimeout(t);
  }, [q, listing]);

  if (!business) return null;
  const status = VERIFY_COPY[business.verification_status] ?? VERIFY_COPY.unverified;
  const linked = Boolean(business.google_place_id);

  async function link() {
    if (!listing || !business) return;
    setBusy(true);
    setMsg(null);
    try {
      await api(`businesses/${business.id}/listing`, {
        method: "PUT",
        body: JSON.stringify({ google_place_id: listing.place_id, places_session: session.current }),
      });
      setListing(null);
      setQ("");
      refresh();
      setMsg({ text: "Linked. Nobody else can register this listing on Footfall now." });
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
      if (e instanceof ApiError && e.code === "already_claimed") {
        setListing({ ...listing, claimed: true, business_name: (e.data.business_name as string) ?? null });
      }
    } finally {
      setBusy(false);
    }
  }

  async function dispute() {
    if (!listing?.business_id) return;
    setBusy(true);
    try {
      await api("claim-requests", { method: "POST", body: JSON.stringify({ business_id: listing.business_id, kind: "dispute", message: `Listing claimed by another account; owner of ${business?.name} says it's theirs.` }) });
      setMsg({ text: "Sent for review — we'll call you within a day." });
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>Google listing</h2>
        <span className={`pill ${status.cls}`}>{status.label}</span>
      </div>
      <p className="section-sub">{status.note}</p>

      {linked ? (
        <div className="listing-box">
          <Icon name="map" size={20} />
          <div className="grow" style={{ minWidth: 0 }}>
            <b>{business.name}</b>
            <span>{business.place_address}</span>
          </div>
          <span className="pill confirmed">Linked</span>
        </div>
      ) : !me?.places_available ? (
        <p className="faint" style={{ fontSize: 13, margin: 0 }}>
          Google search is switching on shortly.
        </p>
      ) : listing ? (
        <>
          <div className="listing-box">
            <Icon name="map" size={20} />
            <div className="grow" style={{ minWidth: 0 }}>
              <b>{listing.name}</b>
              <span>{listing.address}</span>
            </div>
            <button className="btn ghost sm" onClick={() => setListing(null)}>
              Change
            </button>
          </div>
          {listing.claimed && listing.business_id !== business.id ? (
            <div className="needs" style={{ marginTop: 12, marginBottom: 0 }}>
              <span>
                <b>{listing.business_name ?? "Another business"}</b> on Footfall already uses this listing.
              </span>
              <span className="spacer" />
              <button className="btn ghost sm" onClick={dispute} disabled={busy}>
                It&apos;s mine — review it
              </button>
            </div>
          ) : (
            <button className="btn" style={{ marginTop: 12 }} onClick={link} disabled={busy}>
              {busy ? "Linking…" : "Link this listing"}
            </button>
          )}
        </>
      ) : (
        <>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: 10, color: "var(--faint)" }}>
              <Icon name="search" size={17} />
            </span>
            <input placeholder={`Search Google Maps — e.g. ${business.name}`} value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%", paddingLeft: 38 }} />
          </div>
          {results.length > 0 && (
            <div className="ob-results" style={{ marginTop: 8 }}>
              {results.map((r) => (
                <button
                  key={r.place_id}
                  onClick={() =>
                    api<Listing>(`places/${encodeURIComponent(r.place_id)}?session=${session.current}`)
                      .then(setListing)
                      .catch((e) => setMsg({ text: (e as Error).message, error: true }))
                  }
                >
                  <b>{r.name}</b>
                  {r.secondary && <span>{r.secondary}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {msg && (
        <p style={{ fontSize: 13, margin: "12px 0 0", color: msg.error ? "var(--danger)" : "var(--emerald-dark)" }}>{msg.text}</p>
      )}
    </div>
  );
}

const PUSH_COPY: Record<string, string> = {
  unsupported: "This browser can't show notifications. Alerts still appear in the bell while the dashboard is open.",
  unavailable: "Browser alerts are being set up on our side.",
  denied: "Notifications are blocked for getfootfall.com. Allow them in your browser's site settings, then reload.",
  off: "Get a notification for every new booking, change and cancellation — even with this tab closed.",
  on: "On for this browser. Your phone gets them through the Footfall app.",
  busy: "Turning on…",
  checking: "Checking…",
};

export function AlertsCard() {
  const { push, pushError, enablePush, disablePush, sendTest } = useAlerts();
  const [testMsg, setTestMsg] = useState<string | null>(null);
  return (
    <div className="card">
      <div className="card-h">
        <h2>Booking alerts</h2>
        <span className={`pill ${push === "on" ? "confirmed" : "off"}`}>{push === "on" ? "On" : "Off"}</span>
      </div>
      <p className="section-sub">{PUSH_COPY[push]}</p>
      <div className="row">
        {push === "on" ? (
          <>
            <button className="btn ghost" onClick={async () => setTestMsg(await sendTest())}>
              <Icon name="bell" size={16} /> Send a test
            </button>
            <button className="btn ghost" onClick={disablePush}>
              Turn off for this browser
            </button>
          </>
        ) : (push === "off" || push === "busy") ? (
          <button className="btn" onClick={enablePush} disabled={push === "busy"}>
            <Icon name="bell" size={16} /> Turn on booking alerts
          </button>
        ) : null}
        {testMsg && <span className="muted" style={{ fontSize: 13 }}>{testMsg}</span>}
      </div>
      {pushError && <p style={{ color: "var(--danger)", fontSize: 13, margin: "10px 0 0" }}>{pushError}</p>}
    </div>
  );
}

const SECTIONS = [
  { id: "receptionist", label: "Receptionist", icon: "sparkle" },
  { id: "whatsapp", label: "WhatsApp number", icon: "chat" },
  { id: "listing", label: "Google listing", icon: "map" },
  { id: "team-access", label: "Team access", icon: "team" },
  { id: "alerts", label: "Booking alerts", icon: "bell" },
  { id: "grow", label: "Grow", icon: "bolt" },
];

/* Left menu that follows the scroll: the section nearest the top is lit. */
export function SettingsNav() {
  const [present, setPresent] = useState<string[]>(SECTIONS.map((s) => s.id));
  const [active, setActive] = useState("receptionist");

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id).filter((id) => document.getElementById(id));
    const found = ids.length ? ids : SECTIONS.map((s) => s.id);
    setPresent(found);
    const hash = window.location.hash.slice(1);
    const jump = hash ? setTimeout(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }), 400) : undefined;
    const onScroll = () => {
      let current = found[0];
      for (const id of found) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = found[found.length - 1];
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(jump);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav className="set-nav">
      {SECTIONS.filter((s) => present.includes(s.id)).map((s) => (
        <a key={s.id} href={`#${s.id}`} className={active === s.id ? "on" : ""}>
          <Icon name={s.icon} size={16} />
          {s.label}
        </a>
      ))}
    </nav>
  );
}
