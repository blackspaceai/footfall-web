"use client";

/* Who else can open this business — invite by phone, approve requests.
   Staff run bookings and the inbox; managers also edit services, prices,
   hours and the team's calendars; only the owner manages WhatsApp,
   broadcasts, settings and this list. */

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Member = { id: string; phone: string | null; role: "manager" | "staff"; status: string };
type Request = { id: string; requester_phone: string | null; message: string | null; created_at: string };

const ROLE_HELP = {
  staff: "Bookings & inbox",
  manager: "+ services, prices, hours",
};

const fmtPhone = (p: string | null) => (p ? `+${p.slice(0, 2)} ${p.slice(2, 7)} ${p.slice(7)}` : "—");

export function TeamAccessCard({ businessId }: { businessId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"staff" | "manager">("staff");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Member[]>(`businesses/${businessId}/members`).then(setMembers).catch(() => {});
    api<Request[]>(`businesses/${businessId}/claim-requests`).then(setRequests).catch(() => {});
  }, [businessId]);
  useEffect(load, [load]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>Team access</h2>
      </div>
      <p className="section-sub">
        Add your manager or receptionist here instead of sharing your login. They sign up with
        their own number and get access automatically.
      </p>

      {requests.length > 0 && (
        <div className="ta-requests">
          {requests.map((r) => (
            <div key={r.id} className="ta-row">
              <span>
                <b>{fmtPhone(r.requester_phone)}</b> asked to join
                {r.message && <em> — “{r.message}”</em>}
              </span>
              <span className="ta-actions">
                {(["staff", "manager"] as const).map((as) => (
                  <button
                    key={as}
                    className="btn"
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        api(`claim-requests/${r.id}/decision`, {
                          method: "POST",
                          body: JSON.stringify({ approve: true, role: as }),
                        }),
                      )
                    }
                  >
                    Add as {as}
                  </button>
                ))}
                <button
                  className="btn ghost"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api(`claim-requests/${r.id}/decision`, {
                        method: "POST",
                        body: JSON.stringify({ approve: false }),
                      }),
                    )
                  }
                >
                  Decline
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {members.map((m) => (
        <div key={m.id} className="ta-row">
          <span>
            <b>{fmtPhone(m.phone)}</b>{" "}
            <em>{m.status === "invited" ? "invited — not signed up yet" : ROLE_HELP[m.role]}</em>
          </span>
          <span className="ta-actions">
            <select
              value={m.role}
              disabled={busy}
              onChange={(e) =>
                run(() =>
                  api(`members/${m.id}`, { method: "PATCH", body: JSON.stringify({ role: e.target.value }) }),
                )
              }
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
            <button className="btn ghost" disabled={busy} onClick={() => run(() => api(`members/${m.id}`, { method: "DELETE" }))}>
              Remove
            </button>
          </span>
        </div>
      ))}

      <div className="ta-invite">
        <input
          inputMode="tel"
          placeholder="Their mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value as "staff" | "manager")}>
          <option value="staff">Staff — {ROLE_HELP.staff}</option>
          <option value="manager">Manager — {ROLE_HELP.manager}</option>
        </select>
        <button
          className="btn"
          disabled={busy || phone.trim().length < 10}
          onClick={() =>
            run(async () => {
              await api(`businesses/${businessId}/members`, {
                method: "POST",
                body: JSON.stringify({ phone, role }),
              });
              setPhone("");
            })
          }
        >
          Invite
        </button>
      </div>
      {err && <p style={{ color: "#b3442e", fontSize: 13, margin: "8px 0 0" }}>{err}</p>}
    </div>
  );
}
