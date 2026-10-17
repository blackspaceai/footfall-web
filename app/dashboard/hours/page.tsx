"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import { Avatar } from "../ui";

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

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  const memberName = staff.find((s) => s.id === tab)?.name;
  const span = (hm: string) => ((parseInt(hm.slice(0, 2), 10) * 60 + parseInt(hm.slice(3, 5), 10) - 360) / (17 * 60)) * 100;

  return (
    <div className="set-grid" style={{ gridTemplateColumns: "240px minmax(0, 1fr)" }}>
      <div className="card" style={{ padding: 8, marginBottom: 0 }}>
        <button className={`hours-pick ${tab === null ? "on" : ""}`} onClick={() => setTab(null)}>
          <span className="biz-ava" style={{ width: 30, height: 30, flexBasis: 30, fontSize: 13, borderRadius: 9 }}>
            {(business?.name ?? "?")[0]}
          </span>
          <span>
            <b>Business hours</b>
            <small>The default for everyone</small>
          </span>
        </button>
        {staff.length > 0 && <div className="nav-label" style={{ color: "var(--faint)", padding: "12px 10px 4px" }}>Team</div>}
        {staff.map((s) => (
          <button key={s.id} className={`hours-pick ${tab === s.id ? "on" : ""}`} onClick={() => setTab(s.id)}>
            <Avatar name={s.name} size={30} />
            <span>
              <b>{s.name}</b>
              <small>Own schedule or business hours</small>
            </span>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-h">
          <h2>{tab === null ? "When you're open" : `${memberName}'s schedule`}</h2>
          <span className="spacer" />
          {days && (
            <button
              className="btn ghost sm"
              onClick={() => setDays((d) => d!.map((row, i) => (i === 0 ? row : { ...d![0] })))}
              title="Use Monday's hours for every day"
            >
              Copy Monday to all days
            </button>
          )}
        </div>
        {tab !== null && !custom && (
          <p className="ib-banner ai" style={{ margin: "0 0 14px", borderRadius: 10, border: "1px solid #cde9d9" }}>
            {memberName} follows business hours. Change anything below and save to give them their own.
          </p>
        )}
        {days === null ? (
          <div className="empty">Loading…</div>
        ) : (
          <div className="hours-rows">
            {days.map((d, i) => (
              <div key={i} className={`hours-row ${d.open ? "" : "off"}`}>
                <b>{DAYS[i]}</b>
                <label className="switch">
                  <input type="checkbox" checked={d.open} onChange={(e) => patch(i, { open: e.target.checked })} />
                  <span />
                  <em>{d.open ? (tab === null ? "Open" : "Works") : tab === null ? "Closed" : "Off"}</em>
                </label>
                {d.open ? (
                  <span className="row" style={{ flexWrap: "nowrap" }}>
                    <input type="time" value={d.opens_at} onChange={(e) => patch(i, { opens_at: e.target.value })} />
                    <span className="muted">to</span>
                    <input type="time" value={d.closes_at} onChange={(e) => patch(i, { closes_at: e.target.value })} />
                  </span>
                ) : (
                  <span className="faint" style={{ fontSize: 13 }}>
                    {tab === null ? "The AI won't offer slots" : "Not booked this day"}
                  </span>
                )}
                <span className="hours-bar">
                  {d.open && <i style={{ left: `${Math.max(0, span(d.opens_at))}%`, width: `${Math.max(2, span(d.closes_at) - span(d.opens_at))}%` }} />}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn" onClick={() => save()} disabled={busy || !days}>
            {tab === null ? "Save hours" : `Save ${memberName}'s schedule`}
          </button>
          {tab !== null && custom && (
            <button className="btn ghost" onClick={() => save([])} disabled={busy}>
              Reset to business hours
            </button>
          )}
          {saved && <span style={{ color: "var(--emerald-dark)", fontSize: 13 }}>{saved}</span>}
          {err && <span style={{ color: "var(--danger)", fontSize: 13 }}>{err}</span>}
        </div>
      </div>
    </div>
  );
}
