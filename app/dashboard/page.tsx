"use client";

import { useCallback, useEffect, useState } from "react";
import { api, rupees, useBusiness } from "@/lib/api";

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

export default function TodayPage() {
  const { business, error } = useBusiness();
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
