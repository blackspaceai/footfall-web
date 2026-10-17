"use client";

/* BlackSpace-only: businesses waiting for a confirmation call, and
   "this business is mine" disputes. The API 404s for everyone else. */

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Pending = {
  id: string;
  name: string;
  verification_status: string;
  place_address: string | null;
  place_phone: string | null;
  owner_phone: string | null;
  owner_wa_phone: string | null;
  created_at: string;
};
type Dispute = {
  id: string;
  business_name: string | null;
  message: string | null;
  requester_phone: string | null;
  created_at: string;
};

const tel = (p: string | null) => (p ? <a href={`tel:+${p}`}>+{p}</a> : "—");

export default function ReviewPage() {
  const [data, setData] = useState<{ businesses: Pending[]; disputes: Dispute[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ businesses: Pending[]; disputes: Dispute[] }>("review")
      .then(setData)
      .catch((e) => setErr((e as Error).message));
  }, []);
  useEffect(load, [load]);

  async function act(path: string, body?: object) {
    try {
      setData(await api(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  if (err) return <p className="sub">{err}</p>;
  if (!data) return <p className="sub">Loading…</p>;

  return (
    <>
      <h1>Review</h1>
      <p className="sub">Call the number on the listing before verifying. Disputes: confirm who runs the shop.</p>

      <div className="db-card">
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Disputes · {data.disputes.length}</h2>
        {data.disputes.length === 0 && <p className="sub" style={{ margin: 0 }}>None.</p>}
        {data.disputes.map((d) => (
          <div key={d.id} className="ta-row">
            <span>
              <b>{d.business_name}</b> claimed by {tel(d.requester_phone)}
              {d.message && <em> — “{d.message}”</em>}
            </span>
            <span className="ta-actions">
              <button className="btn" onClick={() => act(`review/claims/${d.id}`, { action: "transfer" })}>
                Make them owner
              </button>
              <button className="btn ghost" onClick={() => act(`review/claims/${d.id}`, { action: "reject" })}>
                Reject
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="db-card">
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Not yet verified · {data.businesses.length}</h2>
        {data.businesses.map((b) => (
          <div key={b.id} className="ta-row">
            <span>
              <b>{b.name}</b> <em>{b.verification_status.replace("_", " ")}</em>
              <br />
              <em>
                {b.place_address ?? "No Google listing"} · listing {tel(b.place_phone)} · owner {tel(b.owner_phone)}
              </em>
            </span>
            <span className="ta-actions">
              <button className="btn" onClick={() => act(`review/businesses/${b.id}/verify`)}>
                Verified after call
              </button>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
