"use client";

/* Home: what's happening today, what the AI has done, what needs the owner,
   and what's left to set up. */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useAlerts } from "@/lib/alerts";
import { useBusiness } from "@/lib/business-context";
import { type Booking, isBlock, todayStr, useBookings, useFmt } from "./booking-drawers";
import { Avatar, Icon, StatusPill, phone, rupeesShort, timeAgo } from "./ui";

type Insights = {
  totals: { bookings: number; revenue_minor: number; no_shows: number; no_show_rate: number };
  daily: { date: string; bookings: number; revenue: number }[];
};
type Conversation = { id: string; status: string; last_message_at: string | null; customer_name: string | null };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Kpi({ label, value, icon, tone, foot }: { label: string; value: string; icon: string; tone?: string; foot: React.ReactNode }) {
  return (
    <div className="kpi">
      <div className="k-top">
        <span className="k-label">{label}</span>
        <span className={`k-icon ${tone ?? ""}`}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div className="k-value">{value}</div>
      <div className="k-foot">{foot}</div>
    </div>
  );
}

function SetupCard({ steps }: { steps: { label: string; done: boolean; href: string }[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <div className="card">
      <div className="setup">
        <div className="setup-progress">
          <b>Finish setting up</b>
          <p>
            {done} of {steps.length} done — the AI books better with each one.
          </p>
          <div className="bar">
            <i style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
        </div>
        <div className="steps">
          {steps.map((s) => (
            <Link key={s.label} href={s.href} className={`step ${s.done ? "done" : ""}`}>
              <span className="tick">
                <Icon name="check" size={12} />
              </span>
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { business, error } = useBusiness();
  const { alerts, push } = useAlerts();
  const { openBooking, version } = useBookings();
  const fmt = useFmt();
  const [today, setToday] = useState<Booking[] | null>(null);
  const [week, setWeek] = useState<Insights | null>(null);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [setup, setSetup] = useState({ wa: true, services: true, staff: true });
  const [nowMin, setNowMin] = useState(0);

  const load = useCallback(() => {
    if (!business) return;
    const id = business.id;
    api<Booking[]>(`businesses/${id}/bookings?on=${todayStr()}`).then(setToday).catch(() => setToday([]));
    if (business.role !== "staff") api<Insights>(`businesses/${id}/insights?days=7`).then(setWeek).catch(() => {});
    api<Conversation[]>(`businesses/${id}/conversations`).then(setConvs).catch(() => {});
    Promise.all([
      business.role === "owner"
        ? api<{ connected: boolean }>(`businesses/${id}/wa-account`).then((a) => a.connected).catch(() => true)
        : Promise.resolve(true),
      api<{ name: string }[]>(`businesses/${id}/services`).then((r) => r.some((s) => s.name !== "Blocked time")).catch(() => true),
      api<unknown[]>(`businesses/${id}/staff`).then((r) => r.length > 0).catch(() => true),
    ]).then(([wa, services, staff]) => setSetup({ wa, services, staff }));
  }, [business]);
  useEffect(load, [load, version]);

  useEffect(() => {
    const tick = () =>
      setNowMin(() => {
        const [h, m] = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: fmt.tz }).split(":");
        return parseInt(h, 10) * 60 + parseInt(m, 10);
      });
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [fmt.tz]);

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;
  if (!business) return null;

  const minOf = (ts: string) => {
    const [h, m] = fmt.hm(ts).split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  };
  const day = (today ?? []).filter((b) => b.status !== "cancelled").sort((a, b) => a.start_ts.localeCompare(b.start_ts));
  const real = day.filter((b) => !isBlock(b));
  const kept = real.filter((b) => b.status === "confirmed" || b.status === "completed");
  const value = kept.reduce((s, b) => s + b.price_minor, 0);
  const done = real.filter((b) => b.status === "completed").length;
  const upcoming = real.filter((b) => b.status === "confirmed" && minOf(b.start_ts) >= nowMin);
  const byAI = real.filter((b) => b.source !== "owner").length;
  const needsYou = convs.filter((c) => c.status === "human").length;
  const todayChats = convs.filter((c) => c.last_message_at && new Date(c.last_message_at).toDateString() === new Date().toDateString()).length;
  const nowIdx = day.findIndex((b) => minOf(b.end_ts) > nowMin);
  const next = upcoming[0];

  const steps = [
    ...(business.role === "owner" ? [{ label: "Connect WhatsApp", done: setup.wa, href: "/dashboard/settings" }] : []),
    { label: "Add your services", done: setup.services, href: "/dashboard/services" },
    { label: "Add your team", done: setup.staff, href: "/dashboard/team" },
    ...(business.role === "owner" ? [{ label: "Link Google listing", done: Boolean(business.place_address), href: "/dashboard/settings#listing" }] : []),
    { label: "Turn on booking alerts", done: push === "on" || push === "unsupported", href: "/dashboard/settings#alerts" },
  ];

  return (
    <>
      <div className="hello">
        <div>
          <h2>
            {greeting()}, {business.name}
          </h2>
          <p>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            {next ? ` · next up ${next.service_name} at ${fmt.time(next.start_ts)}` : real.length ? " · that's everything for today" : ""}
          </p>
        </div>
        <Link href="/dashboard/calendar" className="btn ghost">
          <Icon name="calendar" size={16} /> Open calendar
        </Link>
      </div>

      <SetupCard steps={steps} />

      <div className="kpis">
        <Kpi
          label="Bookings today"
          value={String(kept.length)}
          icon="calendar"
          foot={
            <>
              <b>{byAI}</b> booked by AI · {upcoming.length} still to come
            </>
          }
        />
        <Kpi label="Booked value today" value={rupees(value)} icon="rupee" tone="gold" foot={`${done} done · ${upcoming.length} to go`} />
        <Kpi
          label="Last 7 days"
          value={week ? rupeesShort(week.totals.revenue_minor) : "—"}
          icon="chart"
          tone="blue"
          foot={week ? `${week.totals.bookings} bookings` : business.role === "staff" ? "Managers see revenue" : "…"}
        />
        <Kpi
          label="No-shows, 7 days"
          value={week ? String(week.totals.no_shows) : "—"}
          icon="alert"
          tone="red"
          foot={week ? `${week.totals.no_show_rate}% of visits · reminders on` : "…"}
        />
      </div>

      <div className="home-grid">
        <div>
          <div className="card">
            <div className="card-h">
              <h2>Today&apos;s schedule</h2>
              <span className="muted" style={{ fontSize: 13 }}>
                {real.length} booking{real.length === 1 ? "" : "s"}
              </span>
              <span className="spacer" />
              <Link className="more" href="/dashboard/calendar">
                Calendar →
              </Link>
            </div>
            {today === null ? (
              <div className="empty">Loading…</div>
            ) : day.length === 0 ? (
              <div className="empty">
                <b>Nothing booked today yet</b>
                When customers book on WhatsApp, they show up here instantly.
              </div>
            ) : (
              <div className="agenda">
                {day.map((b, i) => {
                  const block = isBlock(b);
                  const past = minOf(b.end_ts) <= nowMin;
                  return (
                    <div key={b.id}>
                      {i === nowIdx && (
                        <div className="ag-now">
                          <i /> Now · {fmt.time(new Date().toISOString())}
                        </div>
                      )}
                      <div className={`ag-item ${past ? "past" : ""}`} onClick={() => openBooking(b, todayStr())}>
                        <div className="ag-time">
                          <b>{fmt.time(b.start_ts)}</b>
                          <small>{Math.round((minOf(b.end_ts) - minOf(b.start_ts)))} min</small>
                        </div>
                        <span className={`ag-bar ${block ? "blocked" : b.status}`} />
                        <div className="ag-main">
                          <b>{block ? "Blocked time" : b.service_name}</b>
                          <small>
                            {!block && <>{b.customer_name ?? phone(b.customer_phone)} · </>}
                            {b.staff_name ?? "Unassigned"}
                            {!block && b.source !== "owner" && (
                              <span className="pill ai plain" style={{ height: 18, fontSize: 10.5, padding: "0 7px" }}>
                                AI
                              </span>
                            )}
                          </small>
                        </div>
                        {block ? <span /> : b.status === "confirmed" ? (
                          <span className="num" style={{ fontWeight: 600 }}>
                            {rupees(b.price_minor)}
                          </span>
                        ) : (
                          <StatusPill status={b.status} />
                        )}
                      </div>
                    </div>
                  );
                })}
                {nowIdx === -1 && real.length > 0 && (
                  <div className="ag-now">
                    <i /> Now — the day&apos;s bookings are done
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card dark ai-card">
            <div className="ai-top">
              <Icon name="sparkle" size={18} />
              <h2>AI receptionist</h2>
              <span className={`ai-status ${business.is_live ? "" : "off"}`}>
                <i className={`live-dot ${business.is_live ? "" : "off"}`} />
                {business.is_live ? "Live" : "Paused"}
              </span>
            </div>
            <div className="ai-stats">
              <div className="ai-stat">
                <b>{todayChats}</b>
                <small>chats today</small>
              </div>
              <div className="ai-stat">
                <b>{byAI}</b>
                <small>booked by AI today</small>
              </div>
            </div>
            {needsYou > 0 ? (
              <Link href="/dashboard/inbox" className="ai-cta">
                <Icon name="chat" size={16} />
                {needsYou} chat{needsYou === 1 ? "" : "s"} need{needsYou === 1 ? "s" : ""} you
                <span style={{ marginLeft: "auto" }}>Open →</span>
              </Link>
            ) : (
              <Link href="/dashboard/inbox" className="ai-cta calm">
                <Icon name="check" size={16} />
                Every chat answered
                <span style={{ marginLeft: "auto" }}>Inbox →</span>
              </Link>
            )}
          </div>

          <div className="card">
            <div className="card-h">
              <h2>Activity</h2>
            </div>
            {alerts.length === 0 ? (
              <div className="empty" style={{ padding: "18px 0" }}>
                New bookings, moves and cancellations will appear here.
              </div>
            ) : (
              <div className="feed">
                {alerts.slice(0, 6).map((a) => (
                  <div key={a.id} className="feed-item">
                    <i className={a.kind} />
                    <div>
                      <b>{a.title}</b>
                      <p>{a.detail}</p>
                      <small>{timeAgo(a.created_at)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {convs.length > 0 && (
            <div className="card">
              <div className="card-h">
                <h2>Latest chats</h2>
                <span className="spacer" />
                <Link className="more" href="/dashboard/inbox">
                  Inbox →
                </Link>
              </div>
              {convs.slice(0, 4).map((c) => (
                <Link key={c.id} href="/dashboard/inbox" className="row" style={{ padding: "7px 0", flexWrap: "nowrap" }}>
                  <Avatar name={c.customer_name ?? "?"} size={30} />
                  <span className="grow" style={{ minWidth: 0, fontSize: 13.5, fontWeight: 500 }}>
                    {c.customer_name ?? "Customer"}
                  </span>
                  {c.status === "human" ? <span className="pill human">Needs you</span> : <span className="faint" style={{ fontSize: 12 }}>{c.last_message_at ? timeAgo(c.last_message_at) : ""}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
