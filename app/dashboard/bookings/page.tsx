"use client";

/* The day's ledger: every booking — by the AI or by you — with filters,
   search and one-click done / no-show. Open a row for everything else. */

import { useCallback, useEffect, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import { type Booking, isBlock, todayStr, useBookings, useFmt } from "../booking-drawers";
import { Avatar, Icon, StatusPill, phone } from "../ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "no_show", label: "No-show" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
};

export default function BookingsPage() {
  const { business, error } = useBusiness();
  const { openBooking, version } = useBookings();
  const fmt = useFmt();
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!business) return;
    api<Booking[]>(`businesses/${business.id}/bookings?on=${date}`).then((r) => setRows(r.filter((b) => !isBlock(b))));
  }, [business, date]);
  useEffect(load, [load, version]);

  async function patch(id: string, body: object) {
    setErr(null);
    try {
      await api(`bookings/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  const all = rows ?? [];
  const count = (k: string) => (k === "all" ? all.length : all.filter((b) => b.status === k).length);
  const shown = all
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => !q || `${b.customer_name ?? ""} ${b.customer_phone} ${b.service_name} ${b.staff_name ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.start_ts.localeCompare(b.start_ts));
  const value = all.filter((b) => b.status === "confirmed" || b.status === "completed").reduce((s, b) => s + b.price_minor, 0);
  const dayTitle = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <div className="cal-toolbar">
        <div className="cal-date">
          <button className="btn ghost icon" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
            <Icon name="left" />
          </button>
          <button className="btn ghost icon" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
            <Icon name="right" />
          </button>
          <h2>{dayTitle}</h2>
          {date === todayStr() ? <span className="today-chip">Today</span> : (
            <button className="btn ghost sm" onClick={() => setDate(todayStr())}>
              Today
            </button>
          )}
          <span className="btn ghost icon picker" title="Pick a date">
            <Icon name="calendar" />
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a date" />
          </span>
        </div>
        <div className="cal-summary">
          <span>
            <b>{all.length}</b> bookings
          </span>
          <span>
            <b>{rupees(value)}</b> value
          </span>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14, justifyContent: "space-between" }}>
        <div className="seg">
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? "on" : ""} onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="faint" style={{ marginLeft: 6, fontWeight: 500 }}>
                {count(f.key)}
              </span>
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: 10, color: "var(--faint)" }}>
            <Icon name="search" size={17} />
          </span>
          <input placeholder="Search customer, service, staff" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280, paddingLeft: 36 }} />
        </div>
      </div>

      {err && <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>}

      <div className="card flush">
        {rows === null ? (
          <div className="empty">Loading…</div>
        ) : shown.length === 0 ? (
          <div className="empty">
            <b>{all.length ? "Nothing matches" : "No bookings on this day"}</b>
            {all.length ? "Try another filter or search." : "Use New booking for walk-ins — WhatsApp bookings appear by themselves."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Service</th>
                <th>With</th>
                <th style={{ textAlign: "right" }}>Value</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }} />
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} style={{ cursor: "pointer", opacity: b.status === "cancelled" ? 0.55 : 1 }} onClick={() => openBooking(b, date)}>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>
                    <b style={{ fontWeight: 600 }}>{fmt.time(b.start_ts)}</b>
                    <span className="cell-sub">until {fmt.time(b.end_ts)}</span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                      <Avatar name={b.customer_name ?? b.customer_phone} size={32} />
                      <span>
                        {b.customer_name ?? "—"}
                        <span className="cell-sub">{phone(b.customer_phone)}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    {b.service_name}
                    <span className="cell-sub">{b.source === "owner" ? "Added by you" : "Booked by AI"}</span>
                  </td>
                  <td>{b.staff_name ?? <span className="pill human">Unassigned</span>}</td>
                  <td className="num" style={{ textAlign: "right" }}>
                    {rupees(b.price_minor)}
                  </td>
                  <td>
                    <StatusPill status={b.status} />
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                    {b.status === "confirmed" && (
                      <span className="row" style={{ justifyContent: "flex-end", gap: 6, flexWrap: "nowrap" }}>
                        <button className="btn ghost sm" onClick={() => patch(b.id, { status: "completed" })}>
                          <Icon name="check" size={15} /> Done
                        </button>
                        <button className="btn ghost sm" onClick={() => patch(b.id, { status: "no_show" })}>
                          No-show
                        </button>
                      </span>
                    )}
                    {(b.status === "completed" || b.status === "no_show") && (
                      <button className="btn ghost sm" onClick={() => patch(b.id, { status: "confirmed" })}>
                        Reopen
                      </button>
                    )}
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
