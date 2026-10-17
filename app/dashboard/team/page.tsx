"use client";

/* The people who take bookings. Each gets their own calendar column; a level
   and surcharge let a senior stylist charge more for the same service. */

import { useCallback, useEffect, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import { type Booking, isBlock, todayStr, useBookings, useFmt } from "../booking-drawers";
import { Avatar, Drawer, Icon } from "../ui";

type Staff = { id: string; name: string; is_active: boolean; tier_label: string | null; price_delta_minor: number };
const LEVELS = ["Junior", "Stylist", "Senior", "Expert", "Master"];

function StaffDrawer({ businessId, row, onClose, onDone }: { businessId: string; row: Staff | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(row?.name ?? "");
  const [tier, setTier] = useState(row?.tier_label ?? "");
  const [extra, setExtra] = useState(row?.price_delta_minor ? String(row.price_delta_minor / 100) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const body = { name: name.trim(), tier_label: tier.trim() || null, price_delta_minor: Math.round(parseFloat(extra || "0") * 100) };
    try {
      if (row) await api(`staff/${row.id}`, { method: "PATCH", body: JSON.stringify(body) });
      else await api(`businesses/${businessId}/staff`, { method: "POST", body: JSON.stringify(body) });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Drawer
      title={row ? `Edit ${row.name}` : "Add a team member"}
      sub="Each person gets their own calendar — customers can ask for them by name."
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={busy || !name.trim()}>
            {busy ? "Saving…" : row ? "Save" : "Add"}
          </button>
        </>
      }
    >
      <label className="field">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya" autoFocus />
      </label>
      <div className="field" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
        Level <span className="faint" style={{ fontWeight: 400 }}>optional</span>
        <div className="row" style={{ gap: 6 }}>
          {LEVELS.map((l) => (
            <button key={l} type="button" className={`btn ${tier.toLowerCase() === l.toLowerCase() ? "" : "ghost"} sm`} onClick={() => setTier(tier.toLowerCase() === l.toLowerCase() ? "" : l)}>
              {l}
            </button>
          ))}
        </div>
        <input value={tier} onChange={(e) => setTier(e.target.value)} placeholder="or type your own — e.g. Senior stylist" />
      </div>
      <label className="field">
        Charges extra (₹ per service)
        <input type="number" min="0" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="0" />
        <small>Added to every service&apos;s base price. Haircut ₹1,000 + ₹200 here = ₹1,200 with this person.</small>
      </label>
      {err && <p className="err">{err}</p>}
    </Drawer>
  );
}

function DayStrip({ bookings }: { bookings: Booking[] }) {
  const { hm, time } = useFmt();
  const { openBooking } = useBookings();
  const mins = (ts: string) => {
    const [h, m] = hm(ts).split(":").map(Number);
    return h * 60 + m;
  };
  const start = Math.min(9 * 60, ...bookings.map((b) => mins(b.start_ts)));
  const end = Math.max(21 * 60, ...bookings.map((b) => mins(b.end_ts)));
  const pct = (m: number) => `${((m - start) / (end - start)) * 100}%`;
  const now = mins(new Date().toISOString());
  const next = bookings.find((b) => b.status === "confirmed" && new Date(b.start_ts).getTime() > Date.now());
  const hourLabel = (m: number) => `${Math.floor(m / 60) % 12 || 12}${m >= 720 ? "p" : "a"}`;
  return (
    <div className="tm-day">
      <div className="tm-strip">
        {bookings.map((b) => (
          <i
            key={b.id}
            className={b.status}
            title={`${time(b.start_ts)} · ${b.service_name} · ${b.customer_name ?? "Customer"}`}
            style={{ left: pct(mins(b.start_ts)), width: `calc(${pct(start + mins(b.end_ts) - mins(b.start_ts))} - 2px)` }}
            onClick={() => openBooking(b, todayStr())}
          />
        ))}
        {now > start && now < end && <span className="tm-now" style={{ left: pct(now) }} />}
      </div>
      <div className="tm-x">
        <span>{hourLabel(start)}</span>
        <span>{hourLabel(Math.round((start + end) / 120) * 60)}</span>
        <span>{hourLabel(end)}</span>
      </div>
      <p className="tm-next">
        {next ? (
          <>
            Next <b>{time(next.start_ts)}</b> · {next.service_name}
            {next.customer_name ? ` · ${next.customer_name}` : ""}
          </>
        ) : bookings.length ? (
          "Done for today"
        ) : (
          "Free all day"
        )}
      </p>
    </div>
  );
}

export default function TeamPage() {
  const { business, error } = useBusiness();
  const { version } = useBookings();
  const [rows, setRows] = useState<Staff[] | null>(null);
  const [today, setToday] = useState<Booking[]>([]);
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const canEdit = business?.role !== "staff";

  const load = useCallback(() => {
    if (!business) return;
    api<Staff[]>(`businesses/${business.id}/staff`).then(setRows);
    api<Booking[]>(`businesses/${business.id}/bookings?on=${todayStr()}`).then(setToday).catch(() => {});
  }, [business, version]);
  useEffect(load, [load]);

  async function toggle(row: Staff) {
    setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)) ?? null);
    await api(`staff/${row.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !row.is_active }) }).catch(load);
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  const todayFor = (id: string) => today.filter((b) => b.staff_id === id && !isBlock(b) && b.status !== "cancelled");
  const unassigned = today.filter((b) => !b.staff_id && !isBlock(b) && b.status !== "cancelled").length;

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <p className="sub" style={{ margin: 0 }}>
          Who takes bookings. Customers can ask for someone by name, and seniors can charge more.
        </p>
        {canEdit && (
          <button className="btn" onClick={() => setEditing("new")}>
            <Icon name="plus" size={16} /> Add team member
          </button>
        )}
      </div>

      {unassigned > 0 && (
        <div className="needs">
          <Icon name="alert" size={17} />
          <span>
            <b>{unassigned}</b> booking{unassigned > 1 ? "s" : ""} today {unassigned > 1 ? "have" : "has"} nobody assigned — open the calendar to give {unassigned > 1 ? "them" : "it"} to someone.
          </span>
          <span className="spacer" />
          <a className="chip" href="/dashboard/calendar">
            Open calendar
          </a>
        </div>
      )}

      {rows === null ? (
        <div className="card">
          <div className="empty">Loading…</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <div className="empty">
            <b>No team yet</b>
            Solo? That&apos;s fine — bookings go to one calendar. Add people to give each their own.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {rows.map((r) => {
            const t = todayFor(r.id);
            return (
              <div key={r.id} className="card" style={{ marginBottom: 0, opacity: r.is_active ? 1 : 0.6 }}>
                <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
                  <Avatar name={r.name} size={46} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b style={{ fontSize: 15.5, fontFamily: "var(--display)" }}>{r.name}</b>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      {r.tier_label || "Team member"}
                      {r.price_delta_minor ? ` · +${rupees(r.price_delta_minor)} per service` : ""}
                    </div>
                  </div>
                </div>
                <DayStrip bookings={t.sort((a, b) => a.start_ts.localeCompare(b.start_ts))} />
                <div className="row" style={{ marginTop: 12, gap: 18, fontSize: 13 }}>
                  <span>
                    <b className="num">{t.length}</b> <span className="muted">today</span>
                  </span>
                  <span>
                    <b className="num">{rupees(t.filter((b) => b.status !== "no_show").reduce((s, b) => s + b.price_minor, 0))}</b>{" "}
                    <span className="muted">booked</span>
                  </span>
                </div>
                <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
                  <label className="switch">
                    <input type="checkbox" checked={r.is_active} disabled={!canEdit} onChange={() => toggle(r)} />
                    <span />
                    <em>{r.is_active ? "Taking bookings" : "Off"}</em>
                  </label>
                  {canEdit && (
                    <button className="btn ghost sm" onClick={() => setEditing(r)}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && business && (
        <StaffDrawer
          businessId={business.id}
          row={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}
