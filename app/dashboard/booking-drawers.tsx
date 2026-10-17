"use client";

/* Booking create / detail drawers, shared by Home, Calendar and Bookings,
   plus a small context so the topbar's "New booking" works on every page
   and pages reload when a booking changes. */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import { Avatar, Drawer, StatusPill, phone } from "./ui";

export type Booking = {
  id: string;
  start_ts: string;
  end_ts: string;
  status: string;
  source?: string;
  customer_name: string | null;
  customer_phone: string;
  service_name: string;
  staff_id: string | null;
  staff_name: string | null;
  price_minor: number;
};
export type Staff = { id: string; name: string; is_active: boolean; tier_label?: string | null };
export type Service = {
  id: string;
  name: string;
  price_minor: number;
  duration_minutes: number;
  is_active: boolean;
  item_type: string;
  category?: string | null;
};

export const todayStr = () => new Date().toLocaleDateString("en-CA");
export const isBlock = (b: Booking) => b.service_name === "Blocked time";

export function useFmt() {
  const { business } = useBusiness();
  const tz = business?.timezone ?? "Asia/Kolkata";
  return useMemo(
    () => ({
      time: (ts: string) =>
        new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: tz }),
      hm: (ts: string) =>
        new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }),
      day: (ymd: string) =>
        new Date(`${ymd}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      tz,
    }),
    [tz],
  );
}

type Draft = { date?: string; time?: string; staffId?: string };
type Ctx = { openNew: (d?: Draft) => void; openBooking: (b: Booking, date: string) => void; version: number };
const BookCtx = createContext<Ctx | null>(null);

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState<{ b: Booking; date: string } | null>(null);
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo<Ctx>(
    () => ({ openNew: (d) => setDraft(d ?? {}), openBooking: (b, date) => setOpen({ b, date }), version }),
    [version],
  );
  return (
    <BookCtx.Provider value={value}>
      {children}
      {draft && (
        <NewBookingDrawer
          draft={draft}
          onClose={() => setDraft(null)}
          onDone={() => {
            setDraft(null);
            bump();
          }}
        />
      )}
      {open && (
        <BookingDrawer
          booking={open.b}
          date={open.date}
          onClose={() => setOpen(null)}
          onDone={() => {
            setOpen(null);
            bump();
          }}
        />
      )}
    </BookCtx.Provider>
  );
}

export function useBookings(): Ctx {
  const ctx = useContext(BookCtx);
  if (!ctx) throw new Error("useBookings must be used inside BookingsProvider");
  return ctx;
}

function useCatalog() {
  const { business } = useBusiness();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => {
    if (!business) return;
    api<Staff[]>(`businesses/${business.id}/staff`).then((r) => setStaff(r.filter((s) => s.is_active)));
    api<Service[]>(`businesses/${business.id}/services`).then((r) =>
      setServices(r.filter((s) => s.is_active && s.item_type !== "product" && s.name !== "Blocked time")),
    );
  }, [business]);
  return { staff, services };
}

function NewBookingDrawer({ draft, onClose, onDone }: { draft: Draft; onClose: () => void; onDone: () => void }) {
  const { business } = useBusiness();
  const { staff, services } = useCatalog();
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState(draft.staffId ?? "");
  const [date, setDate] = useState(draft.date ?? todayStr());
  const [time, setTime] = useState(draft.time ?? "11:00");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId && services[0]) setServiceId(services[0].id);
  }, [services, serviceId]);
  const svc = services.find((s) => s.id === serviceId);

  async function submit() {
    if (!business) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`businesses/${business.id}/bookings`, {
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
      onDone();
    } catch (ex) {
      setErr((ex as Error).message);
      setBusy(false);
    }
  }

  return (
    <Drawer
      title="New booking"
      sub="For walk-ins and phone calls — WhatsApp bookings arrive on their own."
      onClose={onClose}
      footer={
        <>
          <span className="faint" style={{ fontSize: 13 }}>
            {svc ? `${svc.duration_minutes} min · ${rupees(svc.price_minor)}` : ""}
          </span>
          <span className="spacer" />
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={submit} disabled={busy || !serviceId || phone.trim().length < 10}>
            {busy ? "Adding…" : "Add booking"}
          </button>
        </>
      }
    >
      <label className="field">
        Service
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.duration_minutes} min · {rupees(s.price_minor)}
            </option>
          ))}
        </select>
      </label>
      <div className="two">
        <label className="field">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          Time
          <input type="time" value={time} step={900} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      {staff.length > 0 && (
        <div className="field" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
          With
          <div className="choice-grid">
            <button type="button" className={`choice ${staffId === "" ? "on" : ""}`} onClick={() => setStaffId("")}>
              <b>Anyone free</b>
              <small>First available</small>
            </button>
            {staff.map((s) => (
              <button key={s.id} type="button" className={`choice ${staffId === s.id ? "on" : ""}`} onClick={() => setStaffId(s.id)}>
                <b>{s.name}</b>
                <small>{s.tier_label || "Team"}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="field">
        Customer WhatsApp number
        <input inputMode="tel" placeholder="98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <small>They get the confirmation and reminders on WhatsApp.</small>
      </label>
      <label className="field">
        Customer name <small>optional</small>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kavya" />
      </label>
      {err && <p className="err">{err}</p>}
    </Drawer>
  );
}

function BookingDrawer({
  booking,
  date,
  onClose,
  onDone,
}: {
  booking: Booking;
  date: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const fmt = useFmt();
  const { staff } = useCatalog();
  const block = isBlock(booking);
  const startHM = fmt.hm(booking.start_ts);
  const [day, setDay] = useState(date);
  const [time, setTime] = useState(startHM);
  const [staffId, setStaffId] = useState(booking.staff_id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const live = booking.status === "confirmed";

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await api(`bookings/${booking.id}`, { method: "PATCH", body: JSON.stringify(body) });
      onDone();
    } catch (ex) {
      setErr((ex as Error).message);
      setBusy(false);
    }
  }

  function save() {
    const body: Record<string, unknown> = {};
    if (time !== startHM || day !== date) {
      body.date = day;
      body.time = time;
    }
    if (staffId && staffId !== (booking.staff_id ?? "")) body.staff_id = staffId;
    if (Object.keys(body).length === 0) return onClose();
    patch(body);
  }

  const customer = booking.customer_name ?? booking.customer_phone;
  return (
    <Drawer
      title={block ? "Blocked time" : booking.service_name}
      sub={
        <>
          {fmt.day(date)} · {fmt.time(booking.start_ts)}–{fmt.time(booking.end_ts)}
        </>
      }
      onClose={onClose}
      footer={
        <>
          <button
            className="btn danger"
            disabled={busy || booking.status === "cancelled"}
            onClick={() => (confirmCancel ? patch({ status: "cancelled" }) : setConfirmCancel(true))}
          >
            {confirmCancel ? (block ? "Really remove?" : "Really cancel?") : block ? "Remove block" : "Cancel booking"}
          </button>
          <span className="spacer" />
          {live && (
            <button className="btn" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          )}
        </>
      }
    >
      {!block && (
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={customer} size={44} />
          <div className="grow" style={{ minWidth: 0 }}>
            <b style={{ fontSize: 15 }}>{customer}</b>
            <div className="muted" style={{ fontSize: 13 }}>
              {phone(booking.customer_phone)}
            </div>
          </div>
          <StatusPill status={booking.status} />
        </div>
      )}
      {!block && (
        <dl className="summary">
          <dt>Service</dt>
          <dd>{booking.service_name}</dd>
          <dt>With</dt>
          <dd>{booking.staff_name ?? "Not assigned yet"}</dd>
          <dt>Price</dt>
          <dd>{rupees(booking.price_minor)}</dd>
          <dt>Booked by</dt>
          <dd>{booking.source === "owner" ? "You / your team" : "Footfall AI on WhatsApp"}</dd>
        </dl>
      )}
      {live && !block && (
        <div className="row">
          <button className="btn ghost sm" disabled={busy} onClick={() => patch({ status: "completed" })}>
            Mark completed
          </button>
          <button className="btn ghost sm" disabled={busy} onClick={() => patch({ status: "no_show" })}>
            Mark no-show
          </button>
        </div>
      )}
      {live && (
        <>
          <div className="two">
            <label className="field">
              Date
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            </label>
            <label className="field">
              Time
              <input type="time" value={time} step={300} onChange={(e) => setTime(e.target.value)} />
            </label>
          </div>
          {staff.length > 0 && (
            <label className="field">
              With
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                {!booking.staff_id && <option value="">Not assigned</option>}
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <small>Moving a booking re-sends the customer their reminder for the new time.</small>
            </label>
          )}
        </>
      )}
      {err && <p className="err">{err}</p>}
    </Drawer>
  );
}
