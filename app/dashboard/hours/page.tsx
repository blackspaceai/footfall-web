"use client";

import { useCallback, useEffect, useState } from "react";
import { api, useBusiness } from "@/lib/api";

type HoursRow = { weekday: number; opens_at: string; closes_at: string };
type Staff = { id: string; name: string; is_active: boolean };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type DayState = { open: boolean; opens_at: string; closes_at: string };

const defaultDays = (): DayState[] =>
  DAYS.map(() => ({ open: false, opens_at: "10:00", closes_at: "20:00" }));

function rowsToDays(rows: HoursRow[]): DayState[] {
  const byDay = new Map(rows.map((r) => [r.weekday, r]));
  return DAYS.map((_, i) => {
    const r = byDay.get(i);
    return r
      ? { open: true, opens_at: r.opens_at, closes_at: r.closes_at }
      : { open: false, opens_at: "10:00", closes_at: "20:00" };
  });
}

function daysToRows(days: DayState[]): HoursRow[] {
  return days
    .map((d, i) => ({ weekday: i, opens_at: d.opens_at, closes_at: d.closes_at, open: d.open }))
    .filter((d) => d.open)
    .map(({ weekday, opens_at, closes_at }) => ({ weekday, opens_at, closes_at }));
}

export default function HoursPage() {
  const { business, error } = useBusiness();
  const [staff, setStaff] = useState<Staff[]>([]);
  // null = business tab; otherwise a staff id
  const [tab, setTab] = useState<string | null>(null);
  const [days, setDays] = useState<DayState[] | null>(null);
  // For staff tabs: whether this member has custom rows (vs inheriting).
  const [custom, setCustom] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!business) return;
    api<Staff[]>(`businesses/${business.id}/staff`).then((rows) =>
      setStaff(rows.filter((s) => s.is_active))
    );
  }, [business]);

  const load = useCallback(() => {
    if (!business) return;
    setDays(null);
    setSaved(null);
    setErr(null);
    const path =
      tab === null ? `businesses/${business.id}/hours` : `staff/${tab}/hours`;
    api<HoursRow[]>(path).then((rows) => {
      if (tab !== null && rows.length === 0) {
        setCustom(false);
        // Show the inherited business hours as a starting point.
        api<HoursRow[]>(`businesses/${business.id}/hours`).then((biz) =>
          setDays(rowsToDays(biz))
        );
      } else {
        setCustom(true);
        setDays(rowsToDays(rows));
      }
    });
  }, [business, tab]);
  useEffect(load, [load]);

  function patch(i: number, p: Partial<DayState>) {
    setDays((d) => d!.map((row, j) => (j === i ? { ...row, ...p } : row)));
    setSaved(null);
  }

  async function save(rows?: HoursRow[]) {
    if (!business || !days) return;
    setBusy(true);
    setErr(null);
    try {
      const path = tab === null ? `businesses/${business.id}/hours` : `staff/${tab}/hours`;
      await api(path, { method: "PUT", body: JSON.stringify(rows ?? daysToRows(days)) });
      setSaved(
        tab === null
          ? "Saved — the agent offers slots from these hours immediately."
          : "Saved — this member's calendar is live."
      );
      if (rows && rows.length === 0) setCustom(false);
      else setCustom(tab !== null ? true : custom);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    border: active ? "1px solid var(--emerald)" : "1px solid var(--line)",
    background: active ? "var(--emerald)" : "transparent",
    color: active ? "#fff" : "var(--muted)",
  });

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  const memberName = staff.find((s) => s.id === tab)?.name;

  return (
    <>
      <h1>Hours &amp; calendars</h1>
      <p className="sub">
        Business hours are the default; give any team member their own schedule and the agent
        books them accordingly.
      </p>

      <div className="row" style={{ marginBottom: 14 }}>
        <button style={tabStyle(tab === null)} onClick={() => setTab(null)}>
          Business
        </button>
        {staff.map((s) => (
          <button key={s.id} style={tabStyle(tab === s.id)} onClick={() => setTab(s.id)}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="db-card">
        {tab !== null && !custom && (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted)" }}>
            {memberName} currently follows business hours. Edit below and save to give them a
            custom schedule.
          </p>
        )}
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
                      {d.open ? (tab === null ? "Open" : "Works") : tab === null ? "Closed" : "Off"}
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
          <button className="btn" onClick={() => save()} disabled={busy || !days}>
            {tab === null ? "Save hours" : `Save ${memberName}'s schedule`}
          </button>
          {tab !== null && custom && (
            <button className="btn ghost" onClick={() => save([])} disabled={busy}>
              Reset to business hours
            </button>
          )}
          {saved && <span style={{ color: "#0f6e42", fontSize: 13 }}>{saved}</span>}
          {err && <span style={{ color: "#b3442e", fontSize: 13 }}>{err}</span>}
        </div>
      </div>
    </>
  );
}
