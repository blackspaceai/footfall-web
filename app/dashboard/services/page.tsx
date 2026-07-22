"use client";

import { useCallback, useEffect, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";

type Service = {
  id: string;
  name: string;
  item_type: "service" | "product";
  price_minor: number;
  duration_minutes: number;
  is_active: boolean;
};

export default function ServicesPage() {
  const { business, error } = useBusiness();
  const [rows, setRows] = useState<Service[] | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"service" | "product">("service");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!business) return;
    api<Service[]>(`businesses/${business.id}/services`).then(setRows);
  }, [business]);
  useEffect(load, [load]);

  async function add() {
    if (!business || !name.trim() || !price) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`businesses/${business.id}/services`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          item_type: type,
          price_minor: Math.round(parseFloat(price) * 100),
          duration_minutes: type === "product" ? 0 : parseInt(duration || "30", 10),
        }),
      });
      setName("");
      setPrice("");
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: Service) {
    await api(`services/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    load();
  }

  async function remove(row: Service) {
    if (!confirm(`Delete “${row.name}”?`)) return;
    await api(`services/${row.id}`, { method: "DELETE" });
    load();
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  return (
    <>
      <h1>Services &amp; products</h1>
      <p className="sub">
        The agent quotes prices only from this list. Services book time slots; products are
        quotable but never take a slot.
      </p>

      <div className="db-card">
        <div className="row">
          <input
            placeholder="Name — e.g. Haircut, Argan oil 100ml"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 2, minWidth: 200 }}
          />
          <select value={type} onChange={(e) => setType(e.target.value as "service" | "product")}>
            <option value="service">Service</option>
            <option value="product">Product</option>
          </select>
          <input
            placeholder="Price ₹"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: 110 }}
          />
          {type === "service" && (
            <input
              placeholder="Minutes"
              type="number"
              min="5"
              step="5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{ width: 100 }}
            />
          )}
          <button className="btn" onClick={add} disabled={busy || !name.trim() || !price}>
            Add
          </button>
        </div>
        {err && <p style={{ color: "#b3442e", fontSize: 13, margin: "10px 0 0" }}>{err}</p>}
      </div>

      <div className="db-card">
        {rows === null ? (
          <div className="empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">Nothing yet — add your first service above.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.55 }}>
                  <td>{r.name}</td>
                  <td>
                    <span className={`pill ${r.item_type}`}>{r.item_type}</span>
                  </td>
                  <td>{rupees(r.price_minor)}</td>
                  <td>{r.item_type === "product" ? "—" : `${r.duration_minutes} min`}</td>
                  <td>
                    <span className={`pill ${r.is_active ? "confirmed" : "off"}`}>
                      {r.is_active ? "live" : "hidden"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn ghost" onClick={() => toggle(r)}>
                      {r.is_active ? "Hide" : "Show"}
                    </button>{" "}
                    <button className="btn danger" onClick={() => remove(r)}>
                      Delete
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
