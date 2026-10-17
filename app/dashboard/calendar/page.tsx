"use client";

/* Day calendar: one column per team member, time running down — the layout
   salon owners know from paper diaries and Fresha. Click an empty spot to
   book it; click a booking to open it. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import {
  type Booking,
  type Staff,
  isBlock,
  todayStr,
  useBookings,
  useFmt,
} from "../booking-drawers";
import { Avatar, Icon, StatusPill, phone } from "../ui";

type HoursRow = { weekday: number; opens_at: string; closes_at: string };

const HOUR_PX = 76;
const toMin = (hm: string) => parseInt(hm.slice(0, 2), 10) * 60 + parseInt(hm.slice(3, 5), 10);
const toHM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const label12 = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h % 12 === 0 ? 12 : h % 12}${mm ? `:${String(mm).padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`;
};
const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
};
const weekdayIdx = (ymd: string) => (new Date(`${ymd}T12:00:00`).getDay() + 6) % 7; // Mon=0

type Placed = { b: Booking; top: number; height: number; lane: number; lanes: number };

function placeColumn(items: Booking[], startMin: number, minOf: (ts: string) => number): Placed[] {
  const sorted = [...items].sort((a, b) => a.start_ts.localeCompare(b.start_ts));
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const laneEnds: number[] = [];
  const flush = () => {
    const lanes = Math.max(...cluster.map((p) => p.lane + 1), 1);
    cluster.forEach((p) => (p.lanes = lanes));
    out.push(...cluster);
    cluster = [];
    laneEnds.length = 0;
  };
  for (const b of sorted) {
    const s = minOf(b.start_ts);
    const e = Math.max(minOf(b.end_ts), s + 10);
    if (cluster.length && s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e);
    } else laneEnds[lane] = e;
    cluster.push({
      b,
      top: ((s - startMin) / 60) * HOUR_PX,
      height: Math.max(((e - s) / 60) * HOUR_PX - 3, 24),
      lane,
      lanes: 1,
    });
    clusterEnd = Math.max(clusterEnd, e);
  }
  if (cluster.length) flush();
  return out;
}

export default function CalendarPage() {
  const { business } = useBusiness();
  const { openNew, openBooking, version } = useBookings();
  const fmt = useFmt();
  const [date, setDate] = useState(todayStr());
  const [view, setView] = useState<"day" | "list">("day");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [hours, setHours] = useState<HoursRow[]>([]);
  const [weekCounts, setWeekCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("");
  const [ghost, setGhost] = useState<{ col: string; top: number; label: string } | null>(null);
  const [nowMin, setNowMin] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const minOf = useCallback((ts: string) => toMin(fmt.hm(ts)), [fmt]);

  useEffect(() => {
    const tick = () => setNowMin(toMin(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: fmt.tz })));
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [fmt.tz]);

  const load = useCallback(() => {
    if (!business) return;
    api<Booking[]>(`businesses/${business.id}/bookings?on=${date}`).then(setBookings);
    api<Staff[]>(`businesses/${business.id}/staff`).then((r) => setStaff(r.filter((s) => s.is_active)));
    api<HoursRow[]>(`businesses/${business.id}/hours`).then(setHours);
  }, [business, date]);
  useEffect(load, [load, version]);

  // Monday-to-Sunday strip with a booking count per day.
  const weekStart = addDays(date, -weekdayIdx(date));
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  useEffect(() => {
    if (!business) return;
    Promise.all(
      weekDays.map((d) =>
        api<Booking[]>(`businesses/${business.id}/bookings?on=${d}`)
          .then((rows) => [d, rows.filter((b) => b.status !== "cancelled" && !isBlock(b)).length] as const)
          .catch(() => [d, 0] as const),
      ),
    ).then((pairs) => setWeekCounts(Object.fromEntries(pairs)));
  }, [business, weekDays, version]);

  const isToday = date === todayStr();
  const onCal = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const real = onCal.filter((b) => !isBlock(b));
  const kept = real.filter((b) => b.status === "confirmed" || b.status === "completed");
  const value = kept.reduce((s, b) => s + b.price_minor, 0);
  const byAI = real.filter((b) => b.source !== "owner").length;
  const unassigned = onCal.filter((b) => !b.staff_id);

  // Visible window: the day's opening hours, stretched to fit any booking.
  const dayHours = hours.find((h) => h.weekday === weekdayIdx(date));
  const openMin = dayHours ? toMin(dayHours.opens_at) : null;
  const closeMin = dayHours ? toMin(dayHours.closes_at) : null;
  const firstB = onCal.length ? Math.min(...onCal.map((b) => minOf(b.start_ts))) : Infinity;
  const lastB = onCal.length ? Math.max(...onCal.map((b) => minOf(b.end_ts))) : -Infinity;
  const startMin = Math.floor(Math.min(openMin ?? 540, firstB) / 60) * 60;
  const endMin = Math.ceil(Math.max(closeMin ?? 1260, lastB) / 60) * 60;
  const gridH = ((endMin - startMin) / 60) * HOUR_PX;
  const hourMarks = Array.from({ length: (endMin - startMin) / 60 + 1 }, (_, i) => startMin + i * 60);

  const columns = useMemo(() => {
    const shown = staff.filter((s) => !filter || s.name.toLowerCase().includes(filter.toLowerCase()));
    const cols: { id: string; name: string; sub: string; staffId: string | null; items: Booking[]; unassigned?: boolean }[] = [];
    if (unassigned.length && staff.length)
      cols.push({ id: "_none", name: "Unassigned", sub: `${unassigned.length} to assign`, staffId: null, items: unassigned, unassigned: true });
    if (!staff.length) cols.push({ id: "_all", name: "Bookings", sub: `${onCal.length} today`, staffId: null, items: onCal });
    for (const s of shown) {
      const items = onCal.filter((b) => b.staff_id === s.id);
      const n = items.filter((b) => !isBlock(b)).length;
      cols.push({ id: s.id, name: s.name, sub: n ? `${n} booking${n === 1 ? "" : "s"}` : s.tier_label || "Free all day", staffId: s.id, items });
    }
    return cols;
  }, [staff, filter, onCal, unassigned]);

  // Land on "now" for today, else on the first booking.
  useEffect(() => {
    if (!scroller.current || bookings === null) return;
    const target = isToday ? nowMin - 60 : Number.isFinite(firstB) ? firstB - 30 : openMin ?? startMin;
    scroller.current.scrollTop = Math.max(0, ((target - startMin) / 60) * HOUR_PX);
  }, [bookings === null, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const minuteAt = (e: React.MouseEvent<HTMLDivElement>) => {
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const raw = startMin + (y / HOUR_PX) * 60;
    return Math.max(startMin, Math.min(Math.floor(raw / 15) * 15, endMin - 15));
  };

  const dateTitle = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

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
          <h2>{dateTitle}</h2>
          {isToday ? <span className="today-chip">Today</span> : (
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
            <b>{real.length}</b> bookings
          </span>
          <span>
            <b>{rupees(value)}</b> booked
          </span>
          {real.length > 0 && (
            <span>
              <b>{byAI}</b> by AI
            </span>
          )}
        </div>
        <span className="spacer" />
        {staff.length > 6 && (
          <input placeholder="Find a team member…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 200 }} />
        )}
        <div className="seg">
          <button className={view === "day" ? "on" : ""} onClick={() => setView("day")}>
            Day
          </button>
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>
            List
          </button>
        </div>
      </div>

      <div className="week">
        {weekDays.map((d) => {
          const dt = new Date(`${d}T12:00:00`);
          const n = weekCounts[d];
          return (
            <button key={d} className={`${d === date ? "on" : ""} ${d === todayStr() ? "today" : ""}`} onClick={() => setDate(d)}>
              <small>{dt.toLocaleDateString("en-IN", { weekday: "short" })}</small>
              <b>{dt.getDate()}</b>
              <small style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>
                {n === undefined ? " " : n === 0 ? "—" : `${n} booked`}
              </small>
            </button>
          );
        })}
      </div>

      {staff.length > 0 && unassigned.length > 0 && (
        <div className="needs">
          <Icon name="alert" size={16} />
          <b>
            {unassigned.length} booking{unassigned.length === 1 ? "" : "s"} need a team member
          </b>
          {unassigned.map((b) => (
            <span key={b.id} className="chip" onClick={() => openBooking(b, date)}>
              {fmt.time(b.start_ts)} · {b.service_name}
            </span>
          ))}
        </div>
      )}

      {view === "day" ? (
        <div className="card cal">
          {bookings === null ? (
            <div className="empty">Loading the day…</div>
          ) : (
            <div className="cal-scroll" ref={scroller}>
              <div className="cal-grid" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(190px, 1fr))` }}>
                <div className="cal-corner" />
                {columns.map((c) => (
                  <div key={c.id} className={`cal-col-h ${c.unassigned ? "unassigned" : ""}`}>
                    {c.unassigned ? (
                      <span className="ava" style={{ width: 32, height: 32, background: "#f0a02c", fontSize: 13 }}>
                        ?
                      </span>
                    ) : (
                      <Avatar name={c.name} size={32} />
                    )}
                    <span className="who">
                      <b>{c.name}</b>
                      <small>{c.sub}</small>
                    </span>
                  </div>
                ))}

                <div className="cal-gutter" style={{ height: gridH, position: "sticky", left: 0 }}>
                  {hourMarks.slice(0, -1).map((m) => (
                    <span key={m} className="cal-hour" style={{ top: ((m - startMin) / 60) * HOUR_PX + (m === startMin ? 10 : 0) }}>
                      {label12(m)}
                    </span>
                  ))}
                  {isToday && nowMin > startMin && nowMin < endMin && (
                    <span className="cal-now-label" style={{ top: ((nowMin - startMin) / 60) * HOUR_PX }}>
                      {label12(nowMin)}
                    </span>
                  )}
                </div>

                {columns.map((c) => (
                  <div
                    key={c.id}
                    className={`cal-col ${c.unassigned ? "unassigned" : ""}`}
                    style={{ height: gridH }}
                    onMouseMove={(e) => {
                      if ((e.target as HTMLElement).closest(".cal-evt")) return setGhost(null);
                      const m = minuteAt(e);
                      setGhost({ col: c.id, top: ((m - startMin) / 60) * HOUR_PX, label: `+ ${label12(m)}` });
                    }}
                    onMouseLeave={() => setGhost(null)}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest(".cal-evt")) return;
                      openNew({ date, time: toHM(minuteAt(e)), staffId: c.staffId ?? undefined });
                    }}
                  >
                    {openMin !== null && openMin > startMin && (
                      <div className="closed" style={{ top: 0, height: ((openMin - startMin) / 60) * HOUR_PX }} />
                    )}
                    {closeMin !== null && closeMin < endMin && (
                      <div className="closed" style={{ top: ((closeMin - startMin) / 60) * HOUR_PX, bottom: 0 }} />
                    )}
                    {openMin === null && <div className="closed" style={{ top: 0, bottom: 0 }} />}
                    {hourMarks.map((m) => (
                      <div key={m} className="hl" style={{ top: ((m - startMin) / 60) * HOUR_PX }} />
                    ))}
                    {hourMarks.slice(0, -1).map((m) => (
                      <div key={`h${m}`} className="hl half" style={{ top: ((m - startMin + 30) / 60) * HOUR_PX }} />
                    ))}
                    {ghost?.col === c.id && (
                      <div className="cal-ghost" style={{ top: ghost.top, display: "block" }}>
                        {ghost.label}
                      </div>
                    )}
                    {isToday && nowMin > startMin && nowMin < endMin && (
                      <div className="cal-now" style={{ top: ((nowMin - startMin) / 60) * HOUR_PX }} />
                    )}
                    {placeColumn(c.items, startMin, minOf).map(({ b, top, height, lane, lanes }) => {
                      const block = isBlock(b);
                      const past = isToday && minOf(b.end_ts) <= nowMin;
                      const short = height < 44;
                      const who = b.customer_name ?? phone(b.customer_phone);
                      return (
                        <div
                          key={b.id}
                          className={`cal-evt ${block ? "blocked" : b.status} ${past ? "past" : ""} ${short ? "short" : ""}`}
                          style={{
                            top: top + 1,
                            height,
                            left: `calc(${(lane / lanes) * 100}% + 4px)`,
                            width: `calc(${100 / lanes}% - 8px)`,
                          }}
                          title={`${fmt.time(b.start_ts)}–${fmt.time(b.end_ts)} · ${b.service_name}${block ? "" : ` · ${who}`}`}
                          onClick={() => openBooking(b, date)}
                        >
                          <b>{block ? "Blocked" : b.service_name}</b>
                          <span>
                            {fmt.time(b.start_ts)}
                            {!short && !block ? ` · ${who}` : ""}
                          </span>
                          {!short && height > 70 && !block && <span>{rupees(b.price_minor)}</span>}
                          {!short && !block && b.status === "no_show" && <span className="tag">No-show</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card flush">
          {real.length === 0 ? (
            <div className="empty">
              <b>No bookings on this day</b>
              New WhatsApp bookings appear here the moment they&apos;re made.
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
                </tr>
              </thead>
              <tbody>
                {[...(bookings ?? [])]
                  .filter((b) => !isBlock(b))
                  .sort((a, b) => a.start_ts.localeCompare(b.start_ts))
                  .map((b) => (
                    <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => openBooking(b, date)}>
                      <td className="num">
                        {fmt.time(b.start_ts)}
                        <span className="cell-sub">until {fmt.time(b.end_ts)}</span>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                          <Avatar name={b.customer_name ?? b.customer_phone} size={30} />
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
                      <td>{b.staff_name ?? <span className="muted">Unassigned</span>}</td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {rupees(b.price_minor)}
                      </td>
                      <td>
                        <StatusPill status={b.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
