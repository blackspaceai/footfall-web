"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";

type WaAccount = {
  connected: boolean;
  phone_number_id: string | null;
  display_phone: string | null;
  status: string | null;
};

function WhatsAppCard({ businessId }: { businessId: string }) {
  const [acct, setAcct] = useState<WaAccount | null>(null);
  const [editing, setEditing] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () =>
    api<WaAccount>(`businesses/${businessId}/wa-account`).then((a) => {
      setAcct(a);
      setEditing(!a.connected);
    });
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

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
      setMsg("Connected — the agent answers this number now.");
      load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="db-card" style={{ maxWidth: 640 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>WhatsApp connection</div>
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
            <button className="btn ghost" onClick={() => setEditing(true)}>
              Update connection
            </button>
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
          {msg && <p style={{ fontSize: 13, margin: "10px 0 0", color: "#0f6e42" }}>{msg}</p>}
        </>
      )}
    </div>
  );
}

type BusinessFull = {
  id: string;
  name: string;
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [langMode, setLangMode] = useState("en,hi");
  const [notes, setNotes] = useState("");
  const [live, setLive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    api<BusinessFull[]>("businesses").then((rows) => {
      const b = rows.find((r) => r.id === business.id);
      if (!b) return;
      setFull(b);
      setName(b.name);
      setPhone(b.owner_wa_phone ?? "");
      setNotes(b.agent_notes ?? "");
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
          owner_wa_phone: phone.trim() || null,
          languages: langMode.split(","),
          agent_notes: notes.trim() || null,
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
  if (!full) return <p className="sub">Loading…</p>;

  return (
    <>
      <h1>Settings</h1>
      <p className="sub">How your receptionist behaves. Changes apply to the next message.</p>

      <WhatsAppCard businessId={full.id} />

      <div className="db-card" style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>
            Business name
            <input
              style={{ display: "block", width: "100%", marginTop: 6 }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label style={{ fontSize: 13, fontWeight: 700 }}>
            Owner WhatsApp (alerts &amp; digests)
            <input
              style={{ display: "block", width: "100%", marginTop: 6 }}
              placeholder="91XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <div style={{ fontSize: 13, fontWeight: 700 }}>
            Reply language
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {LANGUAGE_MODES.map((m) => (
                <label
                  key={m.value}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "baseline",
                    fontWeight: 400,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="lang"
                    checked={langMode === m.value}
                    onChange={() => {
                      setLangMode(m.value);
                      setSaved(null);
                    }}
                  />
                  <span>
                    <b style={{ fontWeight: 700 }}>{m.label}</b>{" "}
                    <span style={{ color: "var(--muted)", fontSize: 12.5 }}>— {m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label style={{ fontSize: 13, fontWeight: 700 }}>
            Notes for the agent
            <textarea
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                minHeight: 90,
                fontFamily: "inherit",
                fontSize: 14,
                padding: "9px 12px",
                border: "1px solid var(--line)",
                borderRadius: 9,
              }}
              placeholder="Address, parking, UPI id, house rules — anything it should know."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
            <span>
              <b>Agent is live</b>{" "}
              <span style={{ color: "var(--muted)", fontSize: 12.5 }}>
                — untick to silence it (messages still get stored)
              </span>
            </span>
          </label>

          <div className="row">
            <button className="btn" onClick={save} disabled={busy || !name.trim()}>
              Save settings
            </button>
            {saved && <span style={{ color: "#0f6e42", fontSize: 13 }}>{saved}</span>}
            {err && <span style={{ color: "#b3442e", fontSize: 13 }}>{err}</span>}
          </div>
        </div>
      </div>
    </>
  );
}
