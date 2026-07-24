"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const FOREST = "#0b3d2e";
const GREEN = "#17a566";

export default function JoinPage() {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");

  // Prefill the business name if the hero input on the landing page passed one.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("business");
    if (q) setBusiness(q);
  }, []);
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("salon");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const resp = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          business_name: business.trim(),
          whatsapp_phone: phone.trim(),
          category,
          city: city.trim() || null,
          source: "landing",
        }),
      });
      if (!resp.ok) {
        let detail = "Something went wrong. Please try again.";
        try {
          const j = await resp.json();
          detail = typeof j.detail === "string" ? j.detail : detail;
        } catch {}
        throw new Error(detail);
      }
      setDone(true);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f4f7f4",
      }}
    >
      <div
        style={{
          width: 440,
          maxWidth: "100%",
          background: "#fff",
          border: "1px solid #e3e9e3",
          borderRadius: 18,
          padding: "34px 34px 30px",
          boxShadow: "0 12px 40px rgba(11,61,46,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/footfall-mark-transparent.svg" alt="" style={{ height: 26 }} />
          <b style={{ fontSize: 19, color: FOREST }}>footfall</b>
        </div>

        {done ? (
          <>
            <h1 style={{ fontSize: 23, margin: "0 0 8px", color: FOREST }}>You&apos;re on the list 🎉</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#3a473f", margin: 0 }}>
              We&apos;ll message you on WhatsApp within a day to set up Footfall for{" "}
              <b>{business.trim() || "your business"}</b> — number connected, services loaded,
              agent live. Nothing to install.
            </p>
            <p style={{ fontSize: 13.5, marginTop: 20, color: "#6b776f" }}>
              Already set up?{" "}
              <Link href="/login" style={{ color: GREEN, fontWeight: 700 }}>
                Sign in to your dashboard
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 23, margin: "0 0 4px", color: FOREST }}>Start free</h1>
            <p style={{ fontSize: 14, color: "#6b776f", margin: "0 0 18px" }}>
              14 days free · no card · we set it up for you.
            </p>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                placeholder="Business name — e.g. Glow Salon"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="tel"
                placeholder="WhatsApp number — 91XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                minLength={10}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="salon">Salon / spa</option>
                  <option value="clinic">Clinic / dental</option>
                  <option value="gym">Gym / studio</option>
                  <option value="other">Other</option>
                </select>
                <input
                  placeholder="City (optional)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <button
                type="submit"
                disabled={busy || !name.trim() || !business.trim() || phone.trim().length < 10}
                style={{
                  marginTop: 4,
                  background: GREEN,
                  color: "#fff",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "13px",
                  borderRadius: 99,
                  boxShadow: "0 2px 0 #0e7a49",
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "…" : "Get my WhatsApp receptionist"}
              </button>
              {err && <p style={{ color: "#b3261e", fontSize: 13, margin: 0 }}>{err}</p>}
            </form>
            <p style={{ fontSize: 13.5, marginTop: 18, color: "#6b776f", textAlign: "center" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: GREEN, fontWeight: 700 }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #d5ddd6",
  borderRadius: 10,
  padding: "11px 13px",
  fontSize: 14.5,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
