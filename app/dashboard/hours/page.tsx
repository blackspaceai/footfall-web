"use client";

import { useCallback, useEffect, useState } from "react";
import { api, useBusiness } from "@/lib/api";

type HoursRow = { weekday: number; opens_at: string; closes_at: string };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type DayState = { open: boolean; opens_at: string; closes_at: string };

export default function HoursPage() {
  const { business, error } = useBusiness();
  const [days, setDays] = useState<DayState[] | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!business) return;
    api<HoursRow[]>(`businesses/${business.id}/hours`).then((rows) => {
      const byDay = new Map(rows.map((r) => [r.weekday, r]));
      setDays(
        DAYS.map((_, i) => {
          const r = byDay.get(i);
          return r
            ? { open: true, opens_at: r.opens_at, closes_at: r.closes_at }
            : { open: false, opens_at: "10:00", closes_at: "20:00" };
        })
      );
    });
  }, [business]);
  useEffect(load, [load]);

  function patch(i: number, p: Partial<DayState>) {
    setDays((d) => d!.map((row, j) => (j === i ? { ...row, ...p } : row)));
    setSaved(null);
  }

  async function save() {
    if (!business || !days) return;
    setBusy(true);
    setErr(null);
    try {
      const payload = days
        .map((d, i) => ({ weekday: i, opens_at: d.opens_at, closes_at: d.closes_at, open: d.open }))
        .filter((d) => d.open)
        .map(({ weekday, opens_at, closes_at }) => ({ weekday, opens_at, closes_at }));
      await api(`businesses/${business.id}/hours`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSaved("Saved — the agent offers slots from these hours immediately.");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  return (
    <>
      <h1>Opening hours</h1>
      <p className="sub">The agent only ever offers slots inside these windows.</p>

      <div className="db-card">
        {days === null ? (
          <div className="empty">Loading…</div>
        ) : (
          <table>
            <tbody>
              {days.map((d, i) => (
                <tr key={i}>
                  <td style={{ width: 130, fontWeight: 600 }}>{DAYS[i]}</td>
                  <td style={{ width: 90 }}>
                    <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={d.open}
                        onChange={(e) => patch(i, { open: e.target.checked })}
                      />
                      {d.open ? "Open" : "Closed"}
                    </label>
                  </td>
                  <td>
                    {d.open && (
                      <span className="row">
                        <input
                          type="time"
                          value={d.opens_at}
                          onChange={(e) => patch(i, { opens_at: e.target.value })}
                        />
                        <span style={{ color: "var(--muted)" }}>to</span>
                        <input
                          type="time"
                          value={d.closes_at}
                          onChange={(e) => patch(i, { closes_at: e.target.value })}
                        />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn" onClick={save} disabled={busy || !days}>
            Save hours
          </button>
          {saved && <span style={{ color: "#0f6e42", fontSize: 13 }}>{saved}</span>}
          {err && <span style={{ color: "#b3442e", fontSize: 13 }}>{err}</span>}
        </div>
      </div>
    </>
  );
}
