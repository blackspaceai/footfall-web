"use client";

import { useCallback, useEffect, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";

type Booking = {
  id: string;
  start_ts: string;
  end_ts: string;
  status: string;
  source: string;
  customer_name: string | null;
  customer_phone: string;
  service_name: string;
  staff_name: string | null;
  price_minor: number;
};
type Staff = { id: string; name: string; is_active: boolean };
type Service = {
  id: string;
  name: string;
  item_type: string;
  price_minor: number;
  duration_minutes: number;
  is_active: boolean;
};

const todayStr = () => new Date().toLocaleDateString("en-CA");

export default function BookingsPage() {
  const { business, error } = useBusiness();
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // create form
  const [cPhone, setCPhone] = useState("");
  const [cName, setCName] = useState("");
  const [cService, setCService] = useState("");
  const [cStaff, setCStaff] = useState("");
  const [cTime, setCTime] = useState("11:00");
  const [busy, setBusy] = useState(false);

  // inline reschedule
  const [editing, setEditing] = useState<string | null>(null);
  const [eDate, setEDate] = useState(todayStr());
  const [eTime, setETime] = useState("11:00");

  const load = useCallback(() => {
    if (!business) return;
    api<Booking[]>(`businesses/${business.id}/bookings?on=${date}`).then(setRows);
    api<Staff[]>(`businesses/${business.id}/staff`).then((r) =>
      setStaff(r.filter((s) => s.is_active))
    );
    api<Service[]>(`businesses/${business.id}/services`).then((r) =>
      setServices(r.filter((s) => s.is_active && s.item_type === "service"))
    );
  }, [business, date]);
  useEffect(load, [load]);

  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: business?.timezone ?? "Asia/Kolkata",
    });

  async function act(fn: () => Promise<unknown>) {
    setErr(null);
    try {
      await fn();
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const patch = (id: string, body: object) => () =>
    act(() => api(`bookings/${id}`, { method: "PATCH", body: JSON.stringify(body) }));

  async function create() {
    if (!business || !cPhone.trim() || !cService) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`businesses/${business.id}/bookings`, {
        method: "POST",
        body: JSON.stringify({
          customer_phone: cPhone.trim(),
          customer_name: cName.trim() || undefined,
          service_id: cService,
          staff_id: cStaff || undefined,
          date,
          time: cTime,
        }),
      });
      setCPhone("");
      setCName("");
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  return (
    <>
      <h1>Bookings</h1>
      <p className="sub">Everything booked — by the agent or by you. Walk-ins go in here too.</p>

      <div className="db-card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <b style={{ fontSize: 14 }}>New booking</b>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <input
            placeholder="Customer phone — 98XXXXXXXX"
            value={cPhone}
            onChange={(e) => setCPhone(e.target.value)}
            style={{ width: 190 }}
          />
          <input
            placeholder="Name (optional)"
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            style={{ width: 150 }}
          />
          <select value={cService} onChange={(e) => setCService(e.target.value)}>
            <option value="">Service…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {rupees(s.price_minor)}
              </option>
            ))}
          </select>
          <select value={cStaff} onChange={(e) => setCStaff(e.target.value)}>
            <option value="">Anyone free</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input type="time" value={cTime} onChange={(e) => setCTime(e.target.value)} />
          <button className="btn" onClick={create} disabled={busy || !cPhone.trim() || !cService}>
            Book
          </button>
        </div>
        {err && <p style={{ color: "#b3442e", fontSize: 13, margin: "10px 0 0" }}>{err}</p>}
      </div>

      <div className="db-card">
        {rows === null ? (
          <div className="empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">No bookings on this day.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Staff</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} style={{ opacity: b.status === "cancelled" ? 0.5 : 1 }}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {editing === b.id ? (
                      <span className="row">
                        <input
                          type="date"
                          value={eDate}
                          onChange={(e) => setEDate(e.target.value)}
                        />
                        <input
                          type="time"
                          value={eTime}
                          onChange={(e) => setETime(e.target.value)}
                        />
                        <button
                          className="btn"
                          onClick={() => {
                            setEditing(null);
                            act(() =>
                              api(`bookings/${b.id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ date: eDate, time: eTime }),
                              })
                            );
                          }}
                        >
                          ✓
                        </button>
                        <button className="btn ghost" onClick={() => setEditing(null)}>
                          ✕
                        </button>
                      </span>
                    ) : (
                      <>
                        {fmt(b.start_ts)}–{fmt(b.end_ts)}
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {b.source === "owner" ? "added by you" : "via agent"}
                        </div>
                      </>
                    )}
                  </td>
                  <td>
                    {b.customer_name ?? "—"}
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{b.customer_phone}</div>
                  </td>
                  <td>
                    {b.service_name}
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {rupees(b.price_minor)}
                    </div>
                  </td>
                  <td>
                    <select
                      value={staff.find((s) => s.name === b.staff_name)?.id ?? ""}
                      onChange={(e) =>
                        act(() =>
                          api(`bookings/${b.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ staff_id: e.target.value }),
                          })
                        )
                      }
                      style={{ padding: "5px 8px", fontSize: 13 }}
                    >
                      <option value="" disabled>
                        —
                      </option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`pill ${b.status}`}>{b.status.replace("_", "-")}</span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {b.status === "confirmed" && (
                      <>
                        <button
                          className="btn ghost"
                          title="Reschedule"
                          onClick={() => {
                            setEditing(b.id);
                            setEDate(date);
                            setETime(
                              new Date(b.start_ts).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: business?.timezone ?? "Asia/Kolkata",
                              })
                            );
                          }}
                        >
                          Move
                        </button>{" "}
                        <button className="btn ghost" onClick={patch(b.id, { status: "completed" })}>
                          Done
                        </button>{" "}
                        <button className="btn ghost" onClick={patch(b.id, { status: "no_show" })}>
                          No-show
                        </button>{" "}
                        <button className="btn danger" onClick={patch(b.id, { status: "cancelled" })}>
                          Cancel
                        </button>
                      </>
                    )}
                    {b.status !== "confirmed" && b.status !== "cancelled" && (
                      <button className="btn ghost" onClick={patch(b.id, { status: "confirmed" })}>
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
