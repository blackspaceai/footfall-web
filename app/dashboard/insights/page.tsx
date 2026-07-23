"use client";

import { useEffect, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";

type Insights = {
  days: number;
  totals: {
    bookings: number;
    revenue_minor: number;
    no_shows: number;
    cancelled: number;
    no_show_rate: number;
  };
  daily: { date: string; bookings: number; revenue: number }[];
  by_service: { name: string; count: number; revenue: number }[];
  by_staff: { name: string; count: number; revenue: number }[];
  busiest_hours: { hour: number; count: number }[];
};

function Bars({
  items,
  valueKey,
  label,
}: {
  items: { name: string; count: number; revenue: number }[];
  valueKey: "revenue" | "count";
  label: (i: { name: string; count: number; revenue: number }) => string;
}) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((i) => (
        <div key={i.name}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <b>{i.name}</b>
            <span style={{ color: "var(--muted)" }}>{label(i)}</span>
          </div>
          <div style={{ background: "var(--line)", borderRadius: 6, height: 8, marginTop: 4 }}>
            <div
              style={{
                width: `${Math.round((i[valueKey] / max) * 100)}%`,
                background: "var(--emerald)",
                height: 8,
                borderRadius: 6,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const hourLabel = (h: number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ampm}`;
};

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

  const maxHour = data ? Math.max(...data.busiest_hours.map((h) => h.count), 1) : 1;

  return (
    <>
      <h1>Insights</h1>
      <p className="sub">How the business is actually doing — last {days} days.</p>

      <div className="row" style={{ marginBottom: 14 }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            className={days === d ? "btn" : "btn ghost"}
            onClick={() => setDays(d)}
          >
            {d} days
          </button>
        ))}
      </div>

      {data === null ? (
        <div className="db-card">
          <div className="empty">Loading…</div>
        </div>
      ) : (
        <>
          <div className="db-card">
            <span className="stat">
              <b>{data.totals.bookings}</b>
              <span>bookings kept</span>
            </span>
            <span className="stat">
              <b>{rupees(data.totals.revenue_minor)}</b>
              <span>booked value</span>
            </span>
            <span className="stat">
              <b>{data.totals.no_show_rate}%</b>
              <span>no-show rate</span>
            </span>
            <span className="stat">
              <b>{data.totals.cancelled}</b>
              <span>cancelled</span>
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            <div className="db-card" style={{ marginBottom: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Top services</div>
              {data.by_service.length === 0 ? (
                <div className="empty">No data yet.</div>
              ) : (
                <Bars
                  items={data.by_service}
                  valueKey="revenue"
                  label={(i) => `${i.count}× · ${rupees(i.revenue)}`}
                />
              )}
            </div>

            <div className="db-card" style={{ marginBottom: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Team leaderboard</div>
              {data.by_staff.length === 0 ? (
                <div className="empty">No data yet.</div>
              ) : (
                <Bars
                  items={data.by_staff}
                  valueKey="revenue"
                  label={(i) => `${i.count}× · ${rupees(i.revenue)}`}
                />
              )}
            </div>

            <div className="db-card" style={{ marginBottom: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Busiest hours</div>
              {data.busiest_hours.length === 0 ? (
                <div className="empty">No data yet.</div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
                  {data.busiest_hours.map((h) => (
                    <div key={h.hour} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        title={`${hourLabel(h.hour)} — ${h.count}`}
                        style={{
                          height: `${Math.round((h.count / maxHour) * 90)}px`,
                          background: "var(--emerald)",
                          borderRadius: 5,
                          minHeight: 6,
                        }}
                      />
                      <div style={{ fontSize: 9.5, color: "var(--muted)", marginTop: 4 }}>
                        {hourLabel(h.hour)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
