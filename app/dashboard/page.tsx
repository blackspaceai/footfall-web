"use client";

import { useCallback, useEffect, useState } from "react";
import { api, createBusiness, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";

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
type HoursRow = { weekday: number; opens_at: string; closes_at: string };
type Service = {
  id: string;
  name: string;
  price_minor: number;
  duration_minutes: number;
  is_active: boolean;
  item_type: string;
};

const toMin = (hm: string) => parseInt(hm.slice(0, 2), 10) * 60 + parseInt(hm.slice(3, 5), 10);
const toHM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

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

const AVA_COLORS = ["#149c60", "#3c68c0", "#b0642f", "#7d5bb5", "#c04f6e", "#2f8f9c"];
const avaColor = (name: string) =>
  AVA_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVA_COLORS.length];
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w && !w.startsWith("("))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function Timeline({
  staff,
  allStaffCount,
  staffFilter,
  setStaffFilter,
  bookings,
  axis,
  fmt,
  isToday,
  tzNowMin,
  onPick,
}: {
  staff: Staff[];
  allStaffCount: number;
  staffFilter: string;
  setStaffFilter: (v: string) => void;
  bookings: Booking[];
  axis: { open: number; close: number };
  fmt: (ts: string) => string;
  isToday: boolean;
  tzNowMin: number;
  onPick: (staffId: string | null, minute: number) => void;
}) {
  const span = Math.max(axis.close - axis.open, 60);
  const pct = (min: number) => Math.min(100, Math.max(0, ((min - axis.open) / span) * 100));
  const bookMin = (ts: string) => {
    const [h, m] = new Date(ts)
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
      .split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  };
  const hourTicks: number[] = [];
  for (let h = Math.ceil(axis.open / 60); h <= Math.floor(axis.close / 60); h++) hourTicks.push(h * 60);
  const hourLabel = (min: number) => {
    const h = Math.floor(min / 60);
    return `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? "PM" : "AM"}`;
  };

  // Bars span the booking's true duration. When a bar is too narrow to hold
  // its label (< MIN_W), the text sits beside it instead, and the combined
  // footprint decides when a colliding booking drops to a lane below.
  const MIN_W = 14;
  const LABEL_W = 13;
  const LANE_H = 46;
  const unassigned = bookings.filter((b) => !b.staff_name);
  const rows: { name: string; staffId: string | null; items: Booking[] }[] = [
    ...(unassigned.length ? [{ name: "Unassigned", staffId: null, items: unassigned }] : []),
    ...staff.map((s) => ({
      name: s.name,
      staffId: s.id,
      items: bookings.filter((b) => b.staff_name === s.name),
    })),
  ];

  const pickAt = (e: React.MouseEvent<HTMLDivElement>, staffId: string | null) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const raw = axis.open + frac * span;
    const snapped = Math.round(raw / 15) * 15;
    onPick(staffId, Math.max(axis.open, Math.min(snapped, axis.close - 15)));
  };

  return (
    <div className="db-card" style={{ padding: "6px 16px 12px" }}>
      {allStaffCount > 8 && (
        <div className="row" style={{ margin: "10px 0" }}>
          <input
            placeholder="Filter team…"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <span style={{ fontSize: 12, color: "var(--faint)" }}>
            {staff.length} of {allStaffCount} shown
          </span>
        </div>
      )}
      <div className="tl-scroll">
        <div className="tl">
          <div className="tl-row head">
            <div className="tl-name" />
            <div className="tl-track" style={{ minHeight: 30 }}>
              {hourTicks.map((m) => (
                <span key={m} className="tl-tick" style={{ left: `${pct(m)}%` }}>
                  {hourLabel(m)}
                </span>
              ))}
            </div>
          </div>
          {rows.map((row) => {
            const sorted = [...row.items].sort((a, b) => a.start_ts.localeCompare(b.start_ts));
            const laneEnds: number[] = [];
            const placed = sorted.map((b) => {
              const s = pct(bookMin(b.start_ts));
              const w = Math.max(pct(bookMin(b.end_ts)) - s, 1);
              const inside = w >= MIN_W;
              // Narrow bars carry their label outside — to the right, or to
              // the left when the bar sits against the end of the day.
              const labelLeft = !inside && s + w + LABEL_W > 100;
              const foot = inside ? w : w + LABEL_W;
              const footStart = labelLeft ? s - LABEL_W : s;
              let lane = laneEnds.findIndex((endAt) => endAt <= footStart + 0.4);
              if (lane === -1) {
                lane = laneEnds.length;
                laneEnds.push(0);
              }
              laneEnds[lane] = footStart + foot;
              return { b, s, w, lane, inside, labelLeft };
            });
            const lanes = Math.max(laneEnds.length, 1);
            const isUnassigned = row.name === "Unassigned";
            return (
              <div className="tl-row" key={row.name}>
                <div className="tl-name">
                  {isUnassigned ? (
                    <span className="tl-ava" style={{ background: "var(--faint)" }}>?</span>
                  ) : (
                    <span className="tl-ava" style={{ background: avaColor(row.name) }}>
                      {initials(row.name)}
                    </span>
                  )}
                  <span className="tl-who">
                    <b title={row.name}>{row.name}</b>
                    <small>
                      {row.items.length === 0
                        ? "free all day"
                        : `${row.items.length} booking${row.items.length !== 1 ? "s" : ""}`}
                    </small>
                  </span>
                </div>
                <div
                  className="tl-track clickable"
                  style={{ minHeight: 14 + lanes * LANE_H }}
                  title="Click a free spot to add a booking"
                  onClick={(e) => pickAt(e, row.staffId)}
                >
                  {hourTicks.map((m) => (
                    <i key={m} className="tl-grid" style={{ left: `${pct(m)}%` }} />
                  ))}
                  {isToday && tzNowMin > axis.open && tzNowMin < axis.close && (
                    <i className="tl-now" style={{ left: `${pct(tzNowMin)}%` }} />
                  )}
                  {placed.map(({ b, s, w, lane, inside, labelLeft }) => {
                    const isBlock = b.service_name === "Blocked time";
                    const who = b.customer_name ? b.customer_name.split(" ")[0] : null;
                    const cls = isBlock ? "blocked" : b.status;
                    const tip = `${fmt(b.start_ts)}–${fmt(b.end_ts)} · ${b.service_name} · ${b.customer_name ?? b.customer_phone}`;
                    const label = (
                      <>
                        <b>{isBlock ? "Blocked" : b.service_name}</b>
                        <span>
                          {fmt(b.start_ts)}
                          {who && !isBlock ? ` · ${who}` : ""}
                        </span>
                      </>
                    );
                    return (
                      <div key={b.id}>
                        <div
                          className={`tl-block ${cls}${inside ? "" : " slim"}`}
                          style={{
                            left: `${s}%`,
                            width: `${w}%`,
                            top: 7 + lane * LANE_H,
                            height: LANE_H - 6,
                          }}
                          title={tip}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inside && label}
                        </div>
                        {!inside && (
                          <div
                            className={`tl-tag ${cls}${labelLeft ? " left" : ""}`}
                            style={{
                              left: labelLeft ? undefined : `${s + w}%`,
                              right: labelLeft ? `${100 - s}%` : undefined,
                              top: 7 + lane * LANE_H,
                              height: LANE_H - 6,
                            }}
                            title={tip}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BookingModal({
  businessId,
  date,
  staff,
  services,
  draft,
  onClose,
  onCreated,
}: {
  businessId: string;
  date: string;
  staff: Staff[];
  services: Service[];
  draft: { staffId: string; time: string };
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(draft.staffId);
  const [time, setTime] = useState(draft.time);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api(`businesses/${businessId}/bookings`, {
        method: "POST",
        body: JSON.stringify({
          service_id: serviceId,
          staff_id: staffId || null,
          date,
          time,
          customer_phone: phone.trim(),
          customer_name: name.trim() || null,
        }),
      });
      onCreated();
    } catch (ex) {
      setErr((ex as Error).message);
      setBusy(false);
    }
  }

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" onClick={(e) => e.stopPropagation()}>
        <h3>New booking · {dateLabel}</h3>
        <form onSubmit={submit}>
          <label>
            Service
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.duration_minutes} min · {rupees(s.price_minor)}
                </option>
              ))}
            </select>
          </label>
          <div className="row" style={{ alignItems: "stretch" }}>
            <label style={{ flex: 1 }}>
              Time
              <input
                type="time"
                value={time}
                step={900}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </label>
            <label style={{ flex: 1 }}>
              With
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                <option value="">Anyone free</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Customer WhatsApp number
            <input
              placeholder="91XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={10}
            />
          </label>
          <label>
            Customer name (optional)
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          {err && <p style={{ color: "#b3442e", fontSize: 13, margin: 0 }}>{err}</p>}
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" disabled={busy || !serviceId}>
              {busy ? "…" : "Add booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TodayPage() {
  const { business, loaded, error, refresh } = useBusiness();
  const [date, setDate] = useState(todayStr());
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [view, setView] = useState<"columns" | "list">("columns");
  const [axis, setAxis] = useState<{ open: number; close: number }>({ open: 540, close: 1260 });
  const [staffFilter, setStaffFilter] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [draft, setDraft] = useState<{ staffId: string; time: string } | null>(null);

  const load = useCallback(() => {
    if (!business) return;
    api<Booking[]>(`businesses/${business.id}/bookings?on=${date}`).then(setBookings);
    api<Staff[]>(`businesses/${business.id}/staff`).then((rows) =>
      setStaff(rows.filter((s) => s.is_active))
    );
    api<Service[]>(`businesses/${business.id}/services`).then((rows) =>
      setServices(
        rows.filter((s) => s.is_active && s.item_type !== "product" && s.name !== "Blocked time")
      )
    );
    api<HoursRow[]>(`businesses/${business.id}/hours`).then((rows) => {
      if (rows.length) {
        setAxis({
          open: Math.min(...rows.map((r) => toMin(r.opens_at))),
          close: Math.max(...rows.map((r) => toMin(r.closes_at))),
        });
      }
    });
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
      <p className="sub">The business calendar — the whole team at a glance.</p>

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
              className="btn"
              onClick={() => {
                const nowMin = toMin(
                  new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: business?.timezone ?? "Asia/Kolkata",
                  })
                );
                const next = Math.min(
                  Math.max(Math.ceil(nowMin / 15) * 15, axis.open),
                  axis.close - 15
                );
                setDraft({ staffId: "", time: toHM(next) });
              }}
            >
              + New booking
            </button>
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
      ) : all.length === 0 && staff.length === 0 ? (
        <div className="db-card">
          <div className="empty">
            No bookings on this day yet. Add your team under Team to see the calendar.
          </div>
        </div>
      ) : view === "columns" ? (
        <Timeline
          staff={staff.filter(
            (s) => !staffFilter || s.name.toLowerCase().includes(staffFilter.toLowerCase())
          )}
          allStaffCount={staff.length}
          staffFilter={staffFilter}
          setStaffFilter={setStaffFilter}
          bookings={onCalendar}
          axis={axis}
          fmt={fmt}
          isToday={date === todayStr()}
          tzNowMin={(() => {
            const now = new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: business?.timezone ?? "Asia/Kolkata",
            });
            return toMin(now);
          })()}
          onPick={(staffId, minute) => setDraft({ staffId: staffId ?? "", time: toHM(minute) })}
        />
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

      {draft && business && (
        <BookingModal
          businessId={business.id}
          date={date}
          staff={staff}
          services={services}
          draft={draft}
          onClose={() => setDraft(null)}
          onCreated={() => {
            setDraft(null);
            load();
          }}
        />
      )}
    </>
  );
}
