"use client";

import { useCallback, useEffect, useState } from "react";
import { api, createBusiness, rupees, useBusiness } from "@/lib/api";

type Booking = {
  id: string;
  start_ts: string;
  end_ts: string;
  status: string;
  customer_name: string | null;
  customer_phone: string;
  service_name: string;
  staff_name: string | null;
  price_minor: number;
};

const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

function CreateBusinessCard({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("salon");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await createBusiness({
        name: name.trim(),
        category,
        owner_wa_phone: phone.trim() || undefined,
      });
      onCreated();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="db-card" style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22 }}>Set up your business</h1>
      <p className="sub">Two fields and you have a calendar. WhatsApp connect comes after.</p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          placeholder="Business name — e.g. Blush Beauty Salon"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="salon">Salon / spa</option>
          <option value="clinic">Clinic / dental</option>
          <option value="gym">Gym / studio</option>
          <option value="other">Other</option>
        </select>
        <input
          placeholder="Your WhatsApp number for alerts (optional) — 91XXXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className="btn" disabled={busy || !name.trim()}>
          {busy ? "…" : "Create business"}
        </button>
        {err && <p style={{ color: "#b3442e", fontSize: 13, margin: 0 }}>{err}</p>}
      </form>
    </div>
  );
}

export default function TodayPage() {
  const { business, loaded, error, refresh } = useBusiness();
  const [date, setDate] = useState(todayStr());
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  const load = useCallback(() => {
    if (!business) return;
    api<Booking[]>(`businesses/${business.id}/bookings?on=${date}`).then(setBookings);
  }, [business, date]);
  useEffect(load, [load]);

  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: business?.timezone ?? "Asia/Kolkata",
    });

  const active = (bookings ?? []).filter((b) => b.status === "confirmed" || b.status === "completed");
  const revenue = active.reduce((sum, b) => sum + b.price_minor, 0);

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;
  if (loaded && !business) {
    return <CreateBusinessCard onCreated={refresh} />;
  }

  return (
    <>
      <h1>{business ? business.name : "…"}</h1>
      <p className="sub">The day&apos;s calendar — bookings made by your WhatsApp agent land here.</p>

      <div className="db-card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <span className="stat">
              <b>{active.length}</b>
              <span>bookings</span>
            </span>
            <span className="stat">
              <b>{rupees(revenue)}</b>
              <span>booked value</span>
            </span>
            <span className="stat">
              <b>{(bookings ?? []).filter((b) => b.status === "no_show").length}</b>
              <span>no-shows</span>
            </span>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="db-card">
        {bookings === null ? (
          <div className="empty">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="empty">No bookings on this day yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Staff</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    {fmt(b.start_ts)}–{fmt(b.end_ts)}
                  </td>
                  <td>
                    {b.customer_name ?? "—"}
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{b.customer_phone}</div>
                  </td>
                  <td>{b.service_name}</td>
                  <td>{b.staff_name ?? "Anyone"}</td>
                  <td>{rupees(b.price_minor)}</td>
                  <td>
                    <span className={`pill ${b.status}`}>{b.status.replace("_", "-")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
