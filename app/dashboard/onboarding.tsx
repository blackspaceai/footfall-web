"use client";

/* First-run sign-up: prove the person (phone code), then find the business
   (Google listing or name + pincode). A business that's already on Footfall
   is never created twice — the person asks the owner for access, or tells
   us it's theirs. */

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, createBusiness, type Me } from "@/lib/api";

type Suggestion = { place_id: string; name: string; secondary: string | null };
type Listing = {
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  claimed: boolean;
  business_id: string | null;
  business_name: string | null;
};
type Match = { business_id: string; name: string };
type Claim = { id: string; business_name: string | null; kind: string; status: string };

const CATEGORIES = [
  ["salon", "Salon / spa"],
  ["clinic", "Clinic / dental"],
  ["gym", "Gym / studio"],
  ["other", "Other"],
] as const;

const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

function Step({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="db-card ob-card">
      <div className="ob-step">Step {n} of 2</div>
      <h1 style={{ fontSize: 22 }}>{title}</h1>
      <p className="sub">{sub}</p>
      {children}
    </div>
  );
}

function PhoneStep({ me, onVerified }: { me: Me; onVerified: () => void }) {
  const [phone, setPhone] = useState(me.phone ?? "");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [channel, setChannel] = useState<string>("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ phone: string; channel: string; dev_code?: string }>("phone/start", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setSentTo(r.phone);
      setChannel(r.channel);
      setDevCode(r.dev_code ?? null);
      setCode("");
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setErr(null);
    try {
      await api("phone/verify", { method: "POST", body: JSON.stringify({ phone: sentTo, code }) });
      onVerified();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Step
      n={1}
      title="Verify your mobile number"
      sub="One number per account. Booking alerts go here, and it's how we make sure a business is only registered once."
    >
      {!sentTo ? (
        <div className="ob-row">
          <input
            inputMode="tel"
            autoComplete="tel"
            placeholder="Mobile number — 98XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && phone.trim() && send()}
          />
          <button className="btn" onClick={send} disabled={busy || phone.trim().length < 10}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </div>
      ) : (
        <>
          <p className="ob-note">
            Enter the 6-digit code{" "}
            {channel === "whatsapp" ? "sent on WhatsApp to" : channel === "sms" ? "sent by SMS to" : "for"} +{sentTo}.{" "}
            <a onClick={() => setSentTo(null)}>Change number</a>
          </p>
          {devCode && <p className="ob-dev">Test mode — your code is {devCode}</p>}
          <div className="ob-row">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()}
              autoFocus
            />
            <button className="btn" onClick={verify} disabled={busy || code.length !== 6}>
              {busy ? "Checking…" : "Verify"}
            </button>
          </div>
          <p className="ob-note">
            No code? <a onClick={send}>Send again</a>
          </p>
        </>
      )}
      {err && <p className="ob-err">{err}</p>}
    </Step>
  );
}

function RequestAccess({
  businessId,
  businessName,
  onSent,
}: {
  businessId: string;
  businessName: string;
  onSent: (kind: "join" | "dispute") => void;
}) {
  const [mode, setMode] = useState<"choose" | "dispute">("choose");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send(kind: "join" | "dispute") {
    setBusy(true);
    setErr(null);
    try {
      await api("claim-requests", {
        method: "POST",
        body: JSON.stringify({ business_id: businessId, kind, message: message || undefined }),
      });
      onSent(kind);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ob-claimed">
      <b>{businessName} is already on Footfall.</b>
      {mode === "choose" ? (
        <>
          <p>If you work there, ask the owner to add you — you&apos;ll get access as soon as they approve.</p>
          <div className="ob-row">
            <button className="btn" onClick={() => send("join")} disabled={busy}>
              Ask the owner for access
            </button>
            <button className="btn ghost" onClick={() => setMode("dispute")} disabled={busy}>
              This business is mine
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            We&apos;ll check who really runs {businessName} and call you within a day. Anything that helps us
            — your role, the number customers call — goes here.
          </p>
          <textarea
            rows={3}
            placeholder="e.g. I'm the owner; customers call 040-XXXX on our board"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="ob-row">
            <button className="btn" onClick={() => send("dispute")} disabled={busy}>
              Send for review
            </button>
            <button className="btn ghost" onClick={() => setMode("choose")} disabled={busy}>
              Back
            </button>
          </div>
        </>
      )}
      {err && <p className="ob-err">{err}</p>}
    </div>
  );
}

function FindStep({ me, onCreated, onRequested }: { me: Me; onCreated: () => void; onRequested: (kind: "join" | "dispute") => void }) {
  const [manual, setManual] = useState(!me.places_available);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [listing, setListing] = useState<Listing | null>(null);
  const [name, setName] = useState("");
  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState("salon");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const session = useRef<string>(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

  useEffect(() => {
    if (manual || listing || q.trim().length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api<Suggestion[]>(`places/search?q=${encodeURIComponent(q)}&session=${session.current}`)
        .then(setResults)
        .catch((e) => setErr(errText(e)));
    }, 300);
    return () => clearTimeout(t);
  }, [q, manual, listing]);

  async function pick(s: Suggestion) {
    setErr(null);
    setResults([]);
    try {
      setListing(await api<Listing>(`places/${encodeURIComponent(s.place_id)}?session=${session.current}`));
    } catch (e) {
      setErr(errText(e));
    }
  }

  async function create(confirmDistinct = false) {
    setBusy(true);
    setErr(null);
    try {
      await createBusiness(
        listing
          ? { name: listing.name, category, google_place_id: listing.place_id, places_session: session.current }
          : { name: name.trim(), category, pincode: pincode || undefined, confirm_distinct: confirmDistinct },
      );
      onCreated();
    } catch (e) {
      if (e instanceof ApiError && e.code === "similar_exists") {
        setMatches((e.data.matches as Match[]) ?? []);
      } else if (e instanceof ApiError && e.code === "already_claimed" && listing) {
        setListing({ ...listing, claimed: true, business_id: e.data.business_id as string, business_name: e.data.business_name as string });
      } else {
        setErr(errText(e));
      }
    } finally {
      setBusy(false);
    }
  }

  const categoryPicker = (
    <div className="ob-chips">
      {CATEGORIES.map(([key, label]) => (
        <button key={key} type="button" className={category === key ? "on" : ""} onClick={() => setCategory(key)}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Step
      n={2}
      title="Find your business"
      sub={manual ? "Your business name and pincode." : "Search the name you're listed under on Google Maps."}
    >
      {!manual && !listing && (
        <>
          <input
            placeholder="e.g. Sakshi Saloon, Banjara Hills"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          {results.length > 0 && (
            <div className="ob-results">
              {results.map((s) => (
                <button key={s.place_id} onClick={() => pick(s)}>
                  <b>{s.name}</b>
                  {s.secondary && <span>{s.secondary}</span>}
                </button>
              ))}
            </div>
          )}
          <p className="ob-note">
            Not on Google Maps? <a onClick={() => setManual(true)}>Enter your details instead</a>
          </p>
        </>
      )}

      {listing && (
        <>
          <div className="ob-listing">
            <b>{listing.name}</b>
            <span>{listing.address}</span>
            <a onClick={() => setListing(null)}>Not this one</a>
          </div>
          {listing.claimed && listing.business_id ? (
            <RequestAccess businessId={listing.business_id} businessName={listing.business_name ?? listing.name} onSent={onRequested} />
          ) : (
            <>
              {categoryPicker}
              <button className="btn" onClick={() => create()} disabled={busy}>
                {busy ? "Creating…" : `Set up ${listing.name}`}
              </button>
            </>
          )}
        </>
      )}

      {manual && !matches && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Business name — e.g. Blush Beauty Salon" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            inputMode="numeric"
            maxLength={6}
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          />
          {categoryPicker}
          <button className="btn" onClick={() => create()} disabled={busy || !name.trim() || pincode.length !== 6}>
            {busy ? "Creating…" : "Create my business"}
          </button>
          {me.places_available && (
            <p className="ob-note">
              <a onClick={() => setManual(false)}>Search Google Maps instead</a>
            </p>
          )}
        </div>
      )}

      {matches && (
        <div className="ob-claimed">
          <b>Is it one of these? They&apos;re already on Footfall near {pincode}.</b>
          {matches.map((m) => (
            <RequestAccess key={m.business_id} businessId={m.business_id} businessName={m.name} onSent={onRequested} />
          ))}
          <button className="btn ghost" onClick={() => create(true)} disabled={busy}>
            No — {name.trim()} is a different business
          </button>
        </div>
      )}
      {err && <p className="ob-err">{err}</p>}
    </Step>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sent, setSent] = useState<"join" | "dispute" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Me>("me").then(setMe).catch((e) => setErr(errText(e)));
    api<Claim[]>("claim-requests/mine")
      .then((rows) => setClaims(rows.filter((c) => c.status === "pending")))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const waiting = Boolean(sent) || claims.length > 0;
  // While a join request is pending, look for the new access every 15s so
  // the dashboard opens by itself once the owner approves.
  useEffect(() => {
    if (!waiting || sent === "dispute") return;
    const t = setInterval(onDone, 15000);
    return () => clearInterval(t);
  }, [waiting, sent, onDone]);

  if (err) return <p className="ob-err">{err}</p>;
  if (!me) return null;

  return (
    <div className="ob">
      {waiting && (
        <div className="db-card ob-card ob-wait">
          <b>{sent === "dispute" ? "Sent for review" : "Request sent"}</b>
          <p>
            {sent === "dispute"
              ? "We'll call you within a day to confirm who runs the business."
              : `You'll get access as soon as the owner approves${claims[0]?.business_name ? ` — ${claims[0].business_name}` : ""}. This page updates when they do.`}
          </p>
          <button className="btn ghost" onClick={() => { setSent(null); onDone(); }}>
            Check again
          </button>
        </div>
      )}
      {!waiting && me.otp_available && !me.phone_verified && <PhoneStep me={me} onVerified={load} />}
      {!waiting && (!me.otp_available || me.phone_verified) && (
        <FindStep me={me} onCreated={onDone} onRequested={(kind) => { setSent(kind); load(); }} />
      )}
    </div>
  );
}
