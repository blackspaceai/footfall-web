"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";

type Staff = { id: string; name: string; is_active: boolean };

export default function TeamPage() {
  const { business, error } = useBusiness();
  const [rows, setRows] = useState<Staff[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!business) return;
    api<Staff[]>(`businesses/${business.id}/staff`).then(setRows);
  }, [business]);
  useEffect(load, [load]);

  async function add() {
    if (!business || !name.trim()) return;
    setBusy(true);
    try {
      await api(`businesses/${business.id}/staff`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: Staff) {
    await api(`staff/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    load();
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  return (
    <>
      <h1>Team</h1>
      <p className="sub">
        Who works here. Coming next: per-person calendars, so the agent can offer
        &quot;2 PM with Priya&quot;.
      </p>

      <div className="db-card">
        <div className="row">
          <input
            placeholder="Name — e.g. Priya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            style={{ flex: 1, maxWidth: 320 }}
          />
          <button className="btn" onClick={add} disabled={busy || !name.trim()}>
            Add member
          </button>
        </div>
      </div>

      <div className="db-card">
        {rows === null ? (
          <div className="empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">No team members yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.55 }}>
                  <td>{r.name}</td>
                  <td>
                    <span className={`pill ${r.is_active ? "confirmed" : "off"}`}>
                      {r.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn ghost" onClick={() => toggle(r)}>
                      {r.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
