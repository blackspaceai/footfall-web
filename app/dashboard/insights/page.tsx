"use client";

/* How the business is doing: revenue by day, what sells, who brings it in,
   and when the shop is busiest. */

import { useEffect, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import { Avatar, Icon, rupeesShort } from "../ui";

type Item = { name: string; count: number; revenue: number };
type Insights = {
  days: number;
  totals: { bookings: number; revenue_minor: number; no_shows: number; cancelled: number; no_show_rate: number };
  daily: { date: string; bookings: number; revenue: number }[];
  by_service: Item[];
  by_staff: Item[];
  busiest_hours: { hour: number; count: number }[];
};

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "p" : "a"}`;

function fillDays(daily: Insights["daily"], days: number) {
  const map = Object.fromEntries(daily.map((d) => [d.date, d]));
  const out: Insights["daily"] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-CA");
    out.push(map[key] ?? { date: key, bookings: 0, revenue: 0 });
  }
  return out;
}

function RevenueChart({ daily, days }: { daily: Insights["daily"]; days: number }) {
  const series = fillDays(daily, days);
  const max = Math.max(...series.map((d) => d.revenue), 1);
  const every = days <= 7 ? 1 : days <= 30 ? 5 : 15;
  return (
    <>
      <div className="chart">
        {series.map((d) => {
          const dt = new Date(`${d.date}T12:00:00`);
          const weekend = dt.getDay() === 0 || dt.getDay() === 6;
          return (
            <div key={d.date} className={`col ${weekend ? "weekend" : ""}`}>
              <i style={{ height: `${(d.revenue / max) * 100}%` }} />
              <span className="tip">
                {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {rupees(d.revenue)} · {d.bookings} bookings
              </span>
            </div>
          );
        })}
      </div>
      <div className="chart-x">
        {series.map((d, i) => (
          <span key={d.date}>{i % every === 0 ? new Date(`${d.date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
        ))}
      </div>
    </>
  );
}

function Bars({ items, avatars }: { items: Item[]; avatars?: boolean }) {
  const max = Math.max(...items.map((i) => i.revenue), 1);
  const total = items.reduce((s, i) => s + i.revenue, 0) || 1;
  return (
    <div className="hbars">
      {items.slice(0, 8).map((i) => (
        <div key={i.name} className="hbar">
          <div className="t">
            <span className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
              {avatars && <Avatar name={i.name} size={22} />}
              <b>{i.name}</b>
            </span>
            <span>
              {rupees(i.revenue)} · {i.count}× · {Math.round((i.revenue / total) * 100)}%
            </span>
          </div>
          <div className="track">
            <i style={{ width: `${(i.revenue / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const { business, error } = useBusiness();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    if (!business) return;
    setData(null);
    api<Insights>(`businesses/${business.id}/insights?days=${days}`).then(setData);
  }, [business, days]);

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  const t = data?.totals;
  const avg = t && t.bookings ? Math.round(t.revenue_minor / t.bookings) : 0;
  const hours = Array.from({ length: 12 }, (_, i) => i + 9);
  const hourMax = data ? Math.max(...data.busiest_hours.map((h) => h.count), 1) : 1;
  const hourCount = (h: number) => data?.busiest_hours.find((x) => x.hour === h)?.count ?? 0;

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <p className="sub" style={{ margin: 0 }}>
          Kept bookings and their value over the last {days} days.
        </p>
        <div className="seg">
          {[7, 30, 90].map((d) => (
            <button key={d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="kpis">
        {[
          { label: "Revenue", value: t ? rupeesShort(t.revenue_minor) : "—", icon: "rupee", tone: "gold", foot: t ? `${rupees(avg)} average booking` : "…" },
          { label: "Bookings kept", value: t ? String(t.bookings) : "—", icon: "calendar", tone: "", foot: t ? `${(t.bookings / days).toFixed(1)} a day` : "…" },
          { label: "No-show rate", value: t ? `${t.no_show_rate}%` : "—", icon: "alert", tone: "red", foot: t ? `${t.no_shows} no-shows` : "…" },
          { label: "Cancelled", value: t ? String(t.cancelled) : "—", icon: "x", tone: "blue", foot: "Slots freed for the waitlist" },
        ].map((k) => (
          <div key={k.label} className="kpi">
            <div className="k-top">
              <span className="k-label">{k.label}</span>
              <span className={`k-icon ${k.tone}`}>
                <Icon name={k.icon} size={16} />
              </span>
            </div>
            <div className="k-value">{k.value}</div>
            <div className="k-foot">{k.foot}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-h">
          <h2>Revenue by day</h2>
          <span className="spacer" />
          <span className="faint" style={{ fontSize: 12.5 }}>
            Weekends in marigold
          </span>
        </div>
        {data ? <RevenueChart daily={data.daily} days={days} /> : <div className="empty">Loading…</div>}
      </div>

      <div className="home-grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-h">
            <h2>What sells</h2>
          </div>
          {data && data.by_service.length ? <Bars items={data.by_service} /> : <div className="empty">No bookings yet.</div>}
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-h">
            <h2>Team</h2>
          </div>
          {data && data.by_staff.length ? <Bars items={data.by_staff} avatars /> : <div className="empty">No bookings yet.</div>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, paddingBottom: 34 }}>
        <div className="card-h">
          <h2>Busiest hours</h2>
          <span className="spacer" />
          <span className="faint" style={{ fontSize: 12.5 }}>
            Darker = more bookings start then
          </span>
        </div>
        <div className="heat">
          {hours.map((h) => {
            const n = hourCount(h);
            const a = n / hourMax;
            return (
              <div key={h} title={`${hourLabel(h)} · ${n} bookings`} style={{ background: n ? `rgba(20,156,96,${0.12 + a * 0.78})` : undefined }}>
                <span>{hourLabel(h)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
