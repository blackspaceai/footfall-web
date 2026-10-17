"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import { TeamAccessCard } from "./team-access";
import { AlertsCard, ListingCard, SettingsNav } from "./extra-cards";

type WaAccount = {
  connected: boolean;
  phone_number_id: string | null;
  display_phone: string | null;
  status: string | null;
  missed_call_url: string | null;
};

function GrowCard({ acct }: { acct: WaAccount | null }) {
  const [qrReady, setQrReady] = useState(false);
  const digits = acct?.display_phone ? acct.display_phone.replace(/[^0-9]/g, "") : null;
  const waLink = digits ? `https://wa.me/${digits}?text=Hi!` : null;

  useEffect(() => {
    if (!waLink) return;
    let alive = true;
    import("qrcode").then((QR) => {
      const canvas = document.getElementById("grow-qr") as HTMLCanvasElement | null;
      if (canvas && alive) {
        QR.toCanvas(canvas, waLink, { width: 180, margin: 1, color: { dark: "#0b3d2e", light: "#ffffff" } }).then(
          () => setQrReady(true)
        );
      }
    });
    return () => {
      alive = false;
    };
  }, [waLink]);

  function download() {
    const canvas = document.getElementById("grow-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "footfall-book-on-whatsapp-qr.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>Grow</h2>
      </div>
      {!waLink ? (
        <p className="sub" style={{ margin: 0 }}>Connect a WhatsApp number to unlock the booking QR.</p>
      ) : (
        <div className="row" style={{ alignItems: "flex-start", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <canvas id="grow-qr" style={{ borderRadius: 10, border: "1px solid var(--line)" }} />
            <div>
              <button className="btn ghost" onClick={download} disabled={!qrReady} style={{ marginTop: 8 }}>
                Download QR
              </button>
            </div>
          </div>
          <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.6 }}>
            <b>“Book on WhatsApp” QR</b>
            <p style={{ color: "var(--muted)", margin: "4px 0 10px" }}>
              Print it for the counter, shop door, or Instagram bio. One scan opens a chat with
              your AI receptionist: <span style={{ color: "var(--emerald)", fontWeight: 700 }}>{waLink}</span>
            </p>
            {acct?.missed_call_url && (
              <>
                <b>Missed-call rescue</b>
                <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                  Give this webhook URL to your telephony provider (Exotel, Knowlarity…) for
                  unanswered calls — callers instantly get a WhatsApp from the agent:
                </p>
                <code style={{ display: "block", fontSize: 11, background: "var(--paper)", padding: "8px 10px", borderRadius: 8, marginTop: 6, wordBreak: "break-all" }}>
                  {acct.missed_call_url}
                </code>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppCard({ businessId }: { businessId: string }) {
  const [acct, setAcct] = useState<WaAccount | null>(null);
  const [editing, setEditing] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgIsError, setMsgIsError] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = () =>
    api<WaAccount>(`businesses/${businessId}/wa-account`).then((a) => {
      setAcct(a);
      setEditing(!a.connected);
    });
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function testConnection() {
    setTesting(true);
    setMsg(null);
    try {
      const r = await api<{
        ok: boolean;
        detail?: string;
        display_phone_number?: string;
        verified_name?: string;
        quality_rating?: string;
      }>(`businesses/${businessId}/wa-account/test`, { method: "POST" });
      if (r.ok) {
        setMsgIsError(false);
        setMsg(
          `Live ✓ ${r.display_phone_number ?? ""}${
            r.verified_name ? ` · ${r.verified_name}` : ""
          }${r.quality_rating ? ` · quality ${r.quality_rating}` : ""}`
        );
      } else {
        setMsgIsError(true);
        setMsg(r.detail ?? "Connection test failed.");
      }
    } catch (e) {
      setMsgIsError(true);
      setMsg((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  async function connect() {
    setBusy(true);
    setMsg(null);
    try {
      await api(`businesses/${businessId}/wa-account`, {
        method: "PUT",
        body: JSON.stringify({
          phone_number_id: phoneNumberId.trim(),
          access_token: token.trim(),
          waba_id: wabaId.trim() || null,
          display_phone: displayPhone.trim() || null,
        }),
      });
      setToken("");
      setMsgIsError(false);
      setMsg("Connected — the agent answers this number now.");
      load();
    } catch (e) {
      setMsgIsError(true);
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>WhatsApp number</h2>
      </div>
      <p className="section-sub">The number customers message. Your AI receptionist answers it.</p>
      {acct === null ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          {acct.connected && (
            <p style={{ fontSize: 14, margin: "0 0 10px" }}>
              <span className="pill confirmed">connected</span>{" "}
              {acct.display_phone ?? "number"} · id {acct.phone_number_id}
            </p>
          )}
          {!editing ? (
            <div className="row">
              <button className="btn ghost" onClick={() => setEditing(true)}>
                Update connection
              </button>
              {acct.connected && (
                <button className="btn ghost" onClick={testConnection} disabled={testing}>
                  {testing ? "Testing…" : "Test connection"}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                placeholder="Phone number ID (from Meta → WhatsApp → API Setup)"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
              <input
                placeholder="Access token (permanent system-user token)"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <div className="row">
                <input
                  placeholder="WABA ID (optional)"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  placeholder="Display number (optional)"
                  value={displayPhone}
                  onChange={(e) => setDisplayPhone(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div className="row">
                <button
                  className="btn"
                  onClick={connect}
                  disabled={busy || !phoneNumberId.trim() || token.trim().length < 20}
                >
                  {acct.connected ? "Update" : "Connect"}
                </button>
                {acct.connected && (
                  <button className="btn ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
          {msg && (
            <p style={{ fontSize: 13, margin: "10px 0 0", color: msgIsError ? "#b3261e" : "#0f6e42" }}>
              {msg}
            </p>
          )}
        </>
      )}
    </div>
  );
}

type BusinessFull = {
  id: string;
  name: string;
  review_link: string | null;
  category: string;
  owner_wa_phone: string | null;
  languages: string[] | null;
  agent_notes: string | null;
  is_live: boolean;
};

const LANGUAGE_MODES: { value: string; label: string; hint: string }[] = [
  { value: "en,hi", label: "Match the customer", hint: "Replies in their language — Hinglish welcome" },
  { value: "en", label: "English only", hint: "Always replies in English" },
  { value: "hi", label: "Hindi only", hint: "Always replies in Hindi" },
  { value: "te", label: "Telugu only", hint: "Always replies in Telugu" },
  { value: "en,hi,te", label: "Match customer (EN/HI/TE)", hint: "Mirrors English, Hindi, or Telugu" },
];

export default function SettingsPage() {
  const { business, error } = useBusiness();
  const [full, setFull] = useState<BusinessFull | null>(null);
  const [acct, setAcct] = useState<WaAccount | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [langMode, setLangMode] = useState("en,hi");
  const [notes, setNotes] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [live, setLive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isOwner = business?.role === "owner";

  useEffect(() => {
    if (!business) return;
    if (business.role !== "owner") {
      setFull(null);
      return;
    }
    api<WaAccount>(`businesses/${business.id}/wa-account`).then(setAcct);
    api<BusinessFull[]>("businesses").then((rows) => {
      const b = rows.find((r) => r.id === business.id);
      if (!b) return;
      setFull(b);
      setName(b.name);
      setPhone(b.owner_wa_phone ?? "");
      setNotes(b.agent_notes ?? "");
      setReviewLink(b.review_link ?? "");
      setLive(b.is_live);
      const joined = (b.languages ?? ["en", "hi"]).join(",");
      setLangMode(LANGUAGE_MODES.some((m) => m.value === joined) ? joined : "en,hi");
    });
  }, [business]);

  async function save() {
    if (!business) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`businesses/${business.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          // Only sent when changed: a new alert number must be a verified one.
          ...(phone.trim() !== (full?.owner_wa_phone ?? "") ? { owner_wa_phone: phone.trim() || null } : {}),
          languages: langMode.split(","),
          agent_notes: notes.trim() || null,
          review_link: reviewLink.trim() || null,
          is_live: live,
        }),
      });
      setSaved("Saved — the agent uses these settings on its very next reply.");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;
  if (business && !isOwner) {
    return (
      <>
        <h1>Settings</h1>
        <div className="db-card" style={{ maxWidth: 640 }}>
          <p style={{ margin: 0 }}>
            You&apos;re on {business.name}&apos;s team as a <b>{business.role}</b>. The WhatsApp
            number, agent settings and who has access are managed by the owner.
          </p>
        </div>
      </>
    );
  }
  if (!full) return <p className="sub">Loading…</p>;

  return (
    <div className="set-grid">
      <SettingsNav />
      <div style={{ maxWidth: 780, minWidth: 0 }}>
        <section id="receptionist" className="card">
          <div className="card-h">
            <h2>Receptionist</h2>
            <span className="spacer" />
            <label className="switch">
              <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
              <span />
              <em>{live ? "Answering" : "Paused"}</em>
            </label>
          </div>
          <p className="section-sub">
            How your AI receptionist behaves. Paused = messages are still saved, but nobody replies.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="field">
                Business name
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field">
                Your WhatsApp for alerts &amp; digests
                <input placeholder="91XXXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </div>
            <div className="field" style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>
              Reply language
              <div className="choice-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                {LANGUAGE_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`choice ${langMode === m.value ? "on" : ""}`}
                    onClick={() => {
                      setLangMode(m.value);
                      setSaved(null);
                    }}
                  >
                    <b>{m.label}</b>
                    <small>{m.hint}</small>
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              Notes for the receptionist <small>address, parking, UPI id, house rules — anything it should know</small>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. We're on the 1st floor above Café Coffee Day. UPI: blush@okhdfc. No walk-ins after 7:30 PM." />
            </label>
            <label className="field">
              Google review link <small>customers get it 2 hours after a visit</small>
              <input placeholder="https://g.page/r/…/review" value={reviewLink} onChange={(e) => setReviewLink(e.target.value)} />
            </label>
            <div className="row">
              <button className="btn" onClick={save} disabled={busy || !name.trim()}>
                {busy ? "Saving…" : "Save changes"}
              </button>
              {saved && <span style={{ color: "var(--emerald-dark)", fontSize: 13 }}>{saved}</span>}
              {err && <span style={{ color: "var(--danger)", fontSize: 13 }}>{err}</span>}
            </div>
          </div>
        </section>

        <section id="whatsapp">
          <WhatsAppCard businessId={full.id} />
        </section>
        <section id="listing">
          <ListingCard />
        </section>
        <section id="team-access">
          <TeamAccessCard businessId={full.id} />
        </section>
        <section id="alerts">
          <AlertsCard />
        </section>
        <section id="grow">
          <GrowCard acct={acct} />
        </section>
      </div>
    </div>
  );
}
