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
type Staff = { id: string; name: string; is_active: boolean };

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

function BookingCard({ b, fmt }: { b: Booking; fmt: (ts: string) => string }) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderLeft: `4px solid ${b.status === "confirmed" ? "var(--emerald)" : b.status === "no_show" ? "#b3442e" : "#9a9a90"}`,
        borderRadius: 10,
        padding: "8px 12px",
        marginBottom: 8,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>
        {fmt(b.start_ts)}–{fmt(b.end_ts)}
      </div>
      <div style={{ fontSize: 13 }}>{b.service_name}</div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>
        {b.customer_name ?? b.customer_phone} · {rupees(b.price_minor)}
      </div>
      <span className={`pill ${b.status}`} style={{ marginTop: 4 }}>
        {b.status.replace("_", "-")}
      </span>
    </div>
  );
}

export default function TodayPage() {
  const { business, loaded, error, refresh } = useBusiness();
  const [date, setDate] = useState(todayStr());
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [view, setView] = useState<"columns" | "list">("columns");

  const load = useCallback(() => {
    if (!business) return;
    api<Booking[]>(`businesses/${business.id}/bookings?on=${date}`).then(setBookings);
    api<Staff[]>(`businesses/${business.id}/staff`).then((rows) =>
      setStaff(rows.filter((s) => s.is_active))
    );
  }, [business, date]);
  useEffect(load, [load]);

  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: business?.timezone ?? "Asia/Kolkata",
    });

  const all = bookings ?? [];
  const active = all.filter((b) => b.status === "confirmed" || b.status === "completed");
  const revenue = active.reduce((sum, b) => sum + b.price_minor, 0);
  const onCalendar = all.filter((b) => b.status !== "cancelled");
  const unassigned = onCalendar.filter((b) => !b.staff_name);
  const columns: { title: string; items: Booking[] }[] = staff.length
    ? staff.map((s) => ({
        title: s.name,
        items: onCalendar.filter((b) => b.staff_name === s.name),
      }))
    : [{ title: "Bookings", items: onCalendar }];

  async function assign(bookingId: string, staffId: string) {
    if (!staffId) return;
    await api(`bookings/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify({ staff_id: staffId }),
    });
    load();
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;
  if (loaded && !business) {
    return <CreateBusinessCard onCreated={refresh} />;
  }

  return (
    <>
      <h1>{business ? business.name : "…"}</h1>
      <p className="sub">The business calendar — one column per team member.</p>

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
              <b>{all.filter((b) => b.status === "no_show").length}</b>
              <span>no-shows</span>
            </span>
          </div>
          <div className="row">
            <button
              className="btn ghost"
              onClick={() => setView(view === "columns" ? "list" : "columns")}
            >
              {view === "columns" ? "List view" : "Calendar view"}
            </button>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {staff.length > 0 && unassigned.length > 0 && (
        <div
          className="db-card"
          style={{ borderColor: "#f0d9a0", background: "#fdf9ef" }}
        >
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8, color: "#8a6414" }}>
            Needs assignment
          </div>
          {unassigned.map((b) => (
            <div key={b.id} className="row" style={{ marginBottom: 8, fontSize: 13.5 }}>
              <span>
                {fmt(b.start_ts)} · {b.service_name} · {b.customer_name ?? b.customer_phone}
              </span>
              <select
                defaultValue=""
                onChange={(e) => assign(b.id, e.target.value)}
                style={{ padding: "5px 10px" }}
              >
                <option value="" disabled>
                  Assign to…
                </option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {bookings === null ? (
        <div className="db-card">
          <div className="empty">Loading…</div>
        </div>
      ) : all.length === 0 ? (
        <div className="db-card">
          <div className="empty">No bookings on this day yet.</div>
        </div>
      ) : view === "columns" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(180px, 1fr))`,
            gap: 12,
            alignItems: "start",
            overflowX: "auto",
          }}
        >
          {columns.map((col) => (
            <div key={col.title} className="db-card" style={{ marginBottom: 0, padding: 14 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {col.title}
                <span style={{ color: "var(--muted)", fontWeight: 600 }}>{col.items.length}</span>
              </div>
              {col.items.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Free all day</div>
              ) : (
                col.items
                  .slice()
                  .sort((a, b) => a.start_ts.localeCompare(b.start_ts))
                  .map((b) => <BookingCard key={b.id} b={b} fmt={fmt} />)
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="db-card">
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
              {all.map((b) => (
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
        </div>
      )}
    </>
  );
}
