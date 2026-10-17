"use client";

/* BlackSpace HQ: every business on Footfall, where new sign-ups get stuck,
   what the AI booked, and the verification queue. The API 404s for anyone
   who isn't a superadmin, so this page renders nothing useful for them. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, rupees, type Me } from "@/lib/api";
import { Avatar, Icon, phone, rupeesShort, timeAgo } from "../ui";

type BizRow = {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
  owner_email: string | null;
  owner_phone: string | null;
  verification_status: string;
  plan: string | null;
  is_live: boolean;
  place_address: string | null;
  whatsapp: string | null;
  bookings_7d: number;
  bookings_total: number;
  staff: number;
  services: number;
  last_activity: string | null;
};
type Signup = {
  user_id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
  phone: string | null;
  businesses: string[];
};
type Lead = {
  name: string;
  business_name: string | null;
  whatsapp_phone: string;
  category: string | null;
  city: string | null;
  status: string;
  created_at: string;
};
type Overview = {
  kpis: {
    businesses: number;
    live: number;
    new_businesses_7d: number;
    accounts: number;
    bookings_7d: number;
    ai_bookings_7d: number;
    revenue_7d_minor: number;
    chats_7d: number;
    messages_7d: number;
    leads_new: number;
  };
  funnel: Record<"accounts" | "phone_verified" | "business_created" | "whatsapp_connected" | "first_booking", number>;
  daily: { date: string; signups: number; businesses: number; bookings: number }[];
  businesses: BizRow[];
  signups: Signup[];
  leads: Lead[];
};
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
type Dispute = { id: string; business_name: string | null; message: string | null; requester_phone: string | null; created_at: string };
type Review = { businesses: Pending[]; disputes: Dispute[] };

const VERIFY: Record<string, { label: string; cls: string }> = {
  verified: { label: "Verified", cls: "confirmed" },
  pending_review: { label: "Pending check", cls: "human" },
  unverified: { label: "No listing", cls: "off" },
};
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const Tel = ({ p }: { p: string | null }) => (p ? <a href={`tel:+${p.replace(/\D/g, "")}`}>{phone(p)}</a> : <span className="faint">—</span>);

function Spark({ data, k, label, tone }: { data: Overview["daily"]; k: "signups" | "bookings"; label: string; tone: "gold" | "green" }) {
  const max = Math.max(...data.map((d) => d[k]), 1);
  const total = data.reduce((s, d) => s + d[k], 0);
  return (
    <div className="spark">
      <div className="spark-h">
        <span>{label}</span>
        <b className="num">{total}</b>
      </div>
      <div className={`spark-bars ${tone}`}>
        {data.map((d) => (
          <div key={d.date} title={`${day(d.date)} · ${d[k]}`}>
            <i style={{ height: `${(d[k] / max) * 100}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Funnel({ f, otpOn }: { f: Overview["funnel"]; otpOn: boolean }) {
  const steps = [
    { label: "Created an account", n: f.accounts },
    ...(otpOn ? [{ label: "Verified their phone", n: f.phone_verified }] : []),
    { label: "Added a business", n: f.business_created },
    { label: "Connected WhatsApp", n: f.whatsapp_connected },
    { label: "Got a first booking", n: f.first_booking },
  ];
  const top = Math.max(steps[0].n, 1);
  return (
    <div className="funnel">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].n : s.n;
        const lost = i && prev ? Math.round(((prev - s.n) / prev) * 100) : 0;
        return (
          <div key={s.label} className="funnel-step">
            <div className="t">
              <span>{s.label}</span>
              <span>
                <b className="num">{s.n}</b>
                {i > 0 && lost > 0 && <em>−{lost}%</em>}
              </span>
            </div>
            <div className="track">
              <i style={{ width: `${Math.max((s.n / top) * 100, s.n ? 2 : 0)}%` }} />
            </div>
          </div>
        );
      })}
      {!otpOn && <p className="faint" style={{ fontSize: 12, margin: "4px 0 0" }}>Phone codes are off, so that step is skipped for now.</p>}
    </div>
  );
}

function ReviewCard({ review, onAct }: { review: Review; onAct: (path: string, body?: object) => void }) {
  const n = review.businesses.length + review.disputes.length;
  return (
    <div className="card" id="review">
      <div className="card-h">
        <h2>Verification queue</h2>
        <span className={`pill ${n ? "human" : "confirmed"}`}>{n ? `${n} waiting` : "All clear"}</span>
      </div>
      <p className="section-sub">Call the number on the Google listing before you verify. For disputes, confirm who actually runs the shop.</p>
      {n === 0 && <div className="empty">Nothing to check.</div>}
      {review.disputes.map((d) => (
        <div key={d.id} className="adm-q">
          <span className="adm-q-icon red">
            <Icon name="alert" size={16} />
          </span>
          <div className="grow" style={{ minWidth: 0 }}>
            <b>{d.business_name}</b> — someone else says it&apos;s theirs
            <span className="cell-sub">
              <Tel p={d.requester_phone} /> · {timeAgo(d.created_at)}
              {d.message ? ` · “${d.message}”` : ""}
            </span>
          </div>
          <button className="btn sm" onClick={() => onAct(`review/claims/${d.id}`, { action: "transfer" })}>
            Make them owner
          </button>
          <button className="btn ghost sm" onClick={() => onAct(`review/claims/${d.id}`, { action: "reject" })}>
            Reject
          </button>
        </div>
      ))}
      {[...review.businesses].sort((a, b) => Number(b.verification_status === "pending_review") - Number(a.verification_status === "pending_review")).map((b) => (
        <div key={b.id} className="adm-q">
          <span className="adm-q-icon">
            <Icon name="phone" size={16} />
          </span>
          <div className="grow" style={{ minWidth: 0 }}>
            <b>{b.name}</b> <span className={`pill ${VERIFY[b.verification_status]?.cls ?? "off"}`}>{VERIFY[b.verification_status]?.label ?? b.verification_status}</span>
            <span className="cell-sub">
              {b.place_address ?? "No Google listing"} · listing <Tel p={b.place_phone} /> · owner <Tel p={b.owner_phone ?? b.owner_wa_phone} /> · {timeAgo(b.created_at)}
            </span>
          </div>
          <button className="btn sm" onClick={() => onAct(`review/businesses/${b.id}/verify`)}>
            Verified after call
          </button>
        </div>
      ))}
    </div>
  );
}

type Tab = "businesses" | "signups" | "leads";
type BizFilter = "all" | "live" | "setup" | "quiet";

export default function AdminPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("businesses");
  const [filter, setFilter] = useState<BizFilter>("all");
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    api<Overview>("admin/overview")
      .then(setData)
      .catch((e) => setErr((e as Error).message));
    api<Review>("review").then(setReview).catch(() => {});
    api<Me>("me").then(setMe).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function act(path: string, body?: object) {
    try {
      setReview(await api<Review>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }));
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const weekAgo = Date.now() - 7 * 86400_000;
  const bizBuckets = useMemo(() => {
    const rows = data?.businesses ?? [];
    return {
      all: rows,
      live: rows.filter((b) => b.whatsapp && b.is_live),
      setup: rows.filter((b) => !b.whatsapp),
      quiet: rows.filter((b) => !b.last_activity || new Date(b.last_activity).getTime() < weekAgo),
    } satisfies Record<BizFilter, BizRow[]>;
  }, [data, weekAgo]);

  if (err) return <p className="sub">{err === "Not found." ? "This page is for the BlackSpace team." : err}</p>;
  if (!data) return <div className="card"><div className="empty">Loading…</div></div>;

  const k = data.kpis;
  const noBusiness = data.signups.filter((s) => s.businesses.length === 0).length;
  const waiting = review ? review.businesses.length + review.disputes.length : 0;
  const needle = q.trim().toLowerCase();
  const match = (...xs: (string | null | undefined)[]) => !needle || xs.some((x) => x?.toLowerCase().includes(needle));
  const bizShown = bizBuckets[filter].filter((b) => match(b.name, b.category, b.owner_email, b.owner_phone, b.whatsapp, b.place_address));
  const signupsShown = data.signups.filter((s) => match(s.email, s.phone, ...s.businesses));
  const leadsShown = data.leads.filter((l) => match(l.name, l.business_name, l.whatsapp_phone, l.city, l.category));

  return (
    <>
      <div className="hello">
        <div>
          <h2>Footfall HQ</h2>
          <p>Every business on the platform, where sign-ups stall, and what the AI is doing — last 7 days unless noted.</p>
        </div>
        <button className="btn ghost sm" onClick={load}>
          Refresh
        </button>
      </div>

      {waiting > 0 && (
        <a className="needs" href="#review" style={{ textDecoration: "none" }}>
          <Icon name="shield" size={17} />
          <span>
            <b>{waiting}</b> waiting for verification — {review!.disputes.length ? `${review!.disputes.length} dispute${review!.disputes.length > 1 ? "s" : ""}, ` : ""}
            {review!.businesses.length} to call
          </span>
          <span className="spacer" />
          <span className="chip">Review</span>
        </a>
      )}

      <div className="kpis">
        {[
          { label: "Businesses", value: String(k.businesses), icon: "box", tone: "", foot: <><b>{k.live}</b> live on WhatsApp · +{k.new_businesses_7d} this week</> },
          { label: "Accounts", value: String(k.accounts), icon: "users", tone: "blue", foot: <>{noBusiness ? <><b style={{ color: "var(--marigold-text)" }}>{noBusiness}</b> without a business yet</> : "Everyone has a business"}</> },
          { label: "Bookings", value: String(k.bookings_7d), icon: "calendar", tone: "", foot: <><b>{k.ai_bookings_7d}</b> by the AI · {rupeesShort(k.revenue_7d_minor)}</> },
          { label: "Conversations", value: String(k.chats_7d), icon: "chat", tone: "gold", foot: <>{k.messages_7d.toLocaleString("en-IN")} messages{k.leads_new ? <> · <b>{k.leads_new}</b> new leads</> : null}</> },
        ].map((x) => (
          <div key={x.label} className="kpi">
            <div className="k-top">
              <span className="k-label">{x.label}</span>
              <span className={`k-icon ${x.tone}`}>
                <Icon name={x.icon} size={16} />
              </span>
            </div>
            <div className="k-value">{x.value}</div>
            <div className="k-foot">{x.foot}</div>
          </div>
        ))}
      </div>

      <div className="home-grid" style={{ gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)", marginBottom: 16 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-h">
            <h2>Last 14 days</h2>
            <span className="spacer" />
            <span className="faint" style={{ fontSize: 12.5 }}>
              {day(data.daily[0].date)} – {day(data.daily[data.daily.length - 1].date)}
            </span>
          </div>
          <Spark data={data.daily} k="signups" label="New accounts" tone="gold" />
          <Spark data={data.daily} k="bookings" label="Bookings made" tone="green" />
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-h">
            <h2>Sign-up funnel</h2>
            <span className="spacer" />
            <span className="faint" style={{ fontSize: 12.5 }}>
              all time
            </span>
          </div>
          <Funnel f={data.funnel} otpOn={Boolean(me?.otp_available)} />
        </div>
      </div>

      {review && <ReviewCard review={review} onAct={act} />}

      <div className="card flush">
        <div className="adm-tabs">
          <div className="seg">
            {(
              [
                ["businesses", "Businesses", data.businesses.length],
                ["signups", "Sign-ups", data.signups.length],
                ["leads", "Leads", data.leads.length],
              ] as const
            ).map(([key, label, n]) => (
              <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
                {label}
                <span className="faint" style={{ marginLeft: 6, fontWeight: 500 }}>
                  {n}
                </span>
              </button>
            ))}
          </div>
          {tab === "businesses" && (
            <div className="seg">
              {(
                [
                  ["all", "All"],
                  ["live", "Live"],
                  ["setup", "Setting up"],
                  ["quiet", "Quiet 7d"],
                ] as const
              ).map(([key, label]) => (
                <button key={key} className={filter === key ? "on" : ""} onClick={() => setFilter(key)}>
                  {label}
                  <span className="faint" style={{ marginLeft: 6, fontWeight: 500 }}>
                    {bizBuckets[key].length}
                  </span>
                </button>
              ))}
            </div>
          )}
          <span className="spacer" />
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: 9, color: "var(--faint)" }}>
              <Icon name="search" size={16} />
            </span>
            <input placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240, paddingLeft: 34 }} />
          </div>
        </div>

        <div className="adm-scroll">
          {tab === "businesses" && (
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Setup</th>
                  <th style={{ textAlign: "right" }}>Bookings</th>
                  <th>Last active</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {bizShown.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                        <Avatar name={b.name} size={32} />
                        <div style={{ minWidth: 0 }}>
                          <b style={{ fontWeight: 600 }}>{b.name}</b>
                          <span className="cell-sub adm-ellipsis">{[b.category, b.place_address].filter(Boolean).join(" · ") || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="adm-ellipsis" style={{ display: "block" }}>{b.owner_email ?? <span className="faint">—</span>}</span>
                      <span className="cell-sub">
                        <Tel p={b.owner_phone} />
                      </span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 5 }}>
                        <span className={`pill ${VERIFY[b.verification_status]?.cls ?? "off"}`}>{VERIFY[b.verification_status]?.label ?? b.verification_status}</span>
                        {b.whatsapp ? (
                          <span className={`pill ${b.is_live ? "ai" : "off"}`} title={phone(b.whatsapp)}>
                            {b.is_live ? "WhatsApp live" : "AI paused"}
                          </span>
                        ) : (
                          <span className="pill off">No WhatsApp</span>
                        )}
                      </div>
                    </td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      {b.services} services · {b.staff} team
                    </td>
                    <td className="num" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <b style={{ fontWeight: 600 }}>{b.bookings_7d}</b>
                      <span className="cell-sub">{b.bookings_total} total</span>
                    </td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      {b.last_activity ? timeAgo(b.last_activity) : "Never"}
                    </td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      {day(b.created_at)}
                    </td>
                  </tr>
                ))}
                {bizShown.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty">No businesses match.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {tab === "signups" &&
            (data.signups.length === 0 ? (
              <div className="empty">
                <b>Account list unavailable</b>
                Sign-up emails come from Supabase Auth, which this database doesn&apos;t have.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Phone</th>
                    <th>Business</th>
                    <th>Signed up</th>
                    <th>Last sign-in</th>
                  </tr>
                </thead>
                <tbody>
                  {signupsShown.map((s) => (
                    <tr key={s.user_id}>
                      <td>
                        <b style={{ fontWeight: 600 }}>{s.email ?? "—"}</b>
                        {!s.confirmed && <span className="cell-sub">Email not confirmed</span>}
                      </td>
                      <td>{s.phone ? <Tel p={s.phone} /> : <span className="faint">Not verified</span>}</td>
                      <td>{s.businesses.length ? s.businesses.join(", ") : <span className="pill human">Stuck before setup</span>}</td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {day(s.created_at)} · {timeAgo(s.created_at)}
                      </td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {s.last_sign_in_at ? timeAgo(s.last_sign_in_at) : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}

          {tab === "leads" &&
            (data.leads.length === 0 ? (
              <div className="empty">
                <b>No leads yet</b>
                People who fill the &ldquo;get started&rdquo; form on getfootfall.com show up here.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>WhatsApp</th>
                    <th>Category</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsShown.map((l, i) => (
                    <tr key={`${l.whatsapp_phone}-${i}`}>
                      <td>
                        <b style={{ fontWeight: 600 }}>{l.name}</b>
                        {l.business_name && <span className="cell-sub">{l.business_name}</span>}
                      </td>
                      <td>
                        <a href={`https://wa.me/${l.whatsapp_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                          {phone(l.whatsapp_phone)}
                        </a>
                      </td>
                      <td className="muted">{l.category ?? "—"}</td>
                      <td className="muted">{l.city ?? "—"}</td>
                      <td>
                        <span className={`pill ${l.status === "new" ? "human" : "off"}`}>{l.status}</span>
                      </td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {timeAgo(l.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
        </div>
      </div>
      <p className="faint" style={{ fontSize: 12, margin: "4px 2px 0" }}>
        Revenue is the value of confirmed and completed bookings made in the last 7 days ({rupees(k.revenue_7d_minor)}).
      </p>
    </>
  );
}
