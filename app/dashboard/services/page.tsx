"use client";

/* The menu the AI quotes from — grouped by category, edited in a drawer.
   Services take a time slot; products are quotable but never booked. */

import { useCallback, useEffect, useState } from "react";
import { api, rupees } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import { Drawer, Icon } from "../ui";

type Service = {
  id: string;
  name: string;
  category: string | null;
  item_type: "service" | "product";
  price_minor: number;
  duration_minutes: number;
  is_active: boolean;
  rebook_days: number | null;
};

function ServiceDrawer({
  businessId,
  row,
  categories,
  onClose,
  onDone,
}: {
  businessId: string;
  row: Service | null;
  categories: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<"service" | "product">(row?.item_type ?? "service");
  const [name, setName] = useState(row?.name ?? "");
  const [category, setCategory] = useState(row?.category ?? "");
  const [price, setPrice] = useState(row ? String(row.price_minor / 100) : "");
  const [duration, setDuration] = useState(row ? String(row.duration_minutes) : "30");
  const [rebook, setRebook] = useState(row?.rebook_days ? String(row.rebook_days) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const body = {
      name: name.trim(),
      item_type: type,
      category: category.trim() || null,
      price_minor: Math.round(parseFloat(price || "0") * 100),
      duration_minutes: type === "product" ? 0 : parseInt(duration || "30", 10),
      rebook_days: type === "service" && rebook ? parseInt(rebook, 10) : null,
    };
    try {
      if (row) await api(`services/${row.id}`, { method: "PATCH", body: JSON.stringify(body) });
      else await api(`businesses/${businessId}/services`, { method: "POST", body: JSON.stringify(body) });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!row || !confirm(`Delete “${row.name}”? Past bookings keep their price.`)) return;
    setBusy(true);
    try {
      await api(`services/${row.id}`, { method: "DELETE" });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Drawer
      title={row ? `Edit ${row.name}` : "Add to the menu"}
      sub="The AI quotes prices only from this list — it never invents or discounts."
      onClose={onClose}
      footer={
        <>
          {row && (
            <button className="btn danger" onClick={remove} disabled={busy}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={busy || !name.trim() || !price}>
            {busy ? "Saving…" : row ? "Save" : "Add"}
          </button>
        </>
      }
    >
      <div className="choice-grid">
        <button type="button" className={`choice ${type === "service" ? "on" : ""}`} onClick={() => setType("service")}>
          <b>Service</b>
          <small>Takes a time slot</small>
        </button>
        <button type="button" className={`choice ${type === "product" ? "on" : ""}`} onClick={() => setType("product")}>
          <b>Product</b>
          <small>Quoted, never booked</small>
        </button>
      </div>
      <label className="field">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "service" ? "e.g. Haircut" : "e.g. Argan oil 100 ml"} autoFocus />
      </label>
      <label className="field">
        Category <small>groups a long menu — Hair, Skin, Nails…</small>
        <input list="svc-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Hair" />
        <datalist id="svc-cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <div className="two">
        <label className="field">
          Price (₹)
          <input type="number" min="0" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" />
        </label>
        {type === "service" && (
          <label className="field">
            Duration (min)
            <input type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
        )}
      </div>
      {type === "service" && (
        <label className="field">
          Rebook nudge <small>days after a visit — leave blank to turn off</small>
          <input type="number" min="1" value={rebook} onChange={(e) => setRebook(e.target.value)} placeholder="e.g. 28" />
        </label>
      )}
      {err && <p className="err">{err}</p>}
    </Drawer>
  );
}

export default function ServicesPage() {
  const { business, error } = useBusiness();
  const [rows, setRows] = useState<Service[] | null>(null);
  const [filter, setFilter] = useState<"all" | "service" | "product">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const canEdit = business?.role !== "staff";

  const load = useCallback(() => {
    if (!business) return;
    api<Service[]>(`businesses/${business.id}/services`).then((r) => setRows(r.filter((s) => s.name !== "Blocked time")));
  }, [business]);
  useEffect(load, [load]);

  async function toggle(row: Service) {
    setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)) ?? null);
    await api(`services/${row.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !row.is_active }) }).catch(load);
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  const all = rows ?? [];
  const categories = [...new Set(all.map((r) => r.category).filter(Boolean))] as string[];
  const shown = all.filter((r) => (filter === "all" || r.item_type === filter) && (!q || r.name.toLowerCase().includes(q.toLowerCase())));
  const groups = [...new Set(shown.map((r) => r.category ?? ""))].sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="row">
          <div className="seg">
            {(["all", "service", "product"] as const).map((k) => (
              <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
                {k === "all" ? "Everything" : k === "service" ? "Services" : "Products"}
                <span className="faint" style={{ marginLeft: 6, fontWeight: 500 }}>
                  {k === "all" ? all.length : all.filter((r) => r.item_type === k).length}
                </span>
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: 10, color: "var(--faint)" }}>
              <Icon name="search" size={17} />
            </span>
            <input placeholder="Search the menu" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240, paddingLeft: 36 }} />
          </div>
        </div>
        {canEdit && (
          <button className="btn" onClick={() => setEditing("new")}>
            <Icon name="plus" size={16} /> Add service
          </button>
        )}
      </div>

      {rows === null ? (
        <div className="card">
          <div className="empty">Loading…</div>
        </div>
      ) : all.length === 0 ? (
        <div className="card">
          <div className="empty">
            <b>Your menu is empty</b>
            Add services with prices and durations — the AI quotes and books from this list.
          </div>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g || "_"} className="card flush">
            <div className="card-h" style={{ margin: 0, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <h2>{g || "Uncategorised"}</h2>
              <span className="faint" style={{ fontSize: 12.5 }}>
                {shown.filter((r) => (r.category ?? "") === g).length} items
              </span>
            </div>
            <table style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "46%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <tbody>
                {shown
                  .filter((r) => (r.category ?? "") === g)
                  .map((r) => (
                    <tr key={r.id} style={{ cursor: canEdit ? "pointer" : undefined, opacity: r.is_active ? 1 : 0.5 }} onClick={() => canEdit && setEditing(r)}>
                      <td>
                        <b style={{ fontWeight: 600 }}>{r.name}</b>
                        <span className="cell-sub">
                          {r.item_type === "product" ? "Product" : `${r.duration_minutes} min`}
                          {r.rebook_days ? ` · rebook nudge after ${r.rebook_days} days` : ""}
                        </span>
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {rupees(r.price_minor)}
                      </td>
                      <td>
                        <span className={`pill ${r.item_type}`}>{r.item_type === "product" ? "Product" : "Service"}</span>
                      </td>
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <label className="switch" title={r.is_active ? "The AI offers this" : "Hidden from the AI"}>
                          <input type="checkbox" checked={r.is_active} disabled={!canEdit} onChange={() => toggle(r)} />
                          <span />
                          <em>{r.is_active ? "Live" : "Hidden"}</em>
                        </label>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {editing && business && (
        <ServiceDrawer
          businessId={business.id}
          row={editing === "new" ? null : editing}
          categories={categories}
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
