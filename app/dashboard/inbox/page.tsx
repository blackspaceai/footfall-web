"use client";

/* Every WhatsApp conversation, WhatsApp-shaped. Amber = waiting for the
   owner; replying takes the chat over, and it returns to the AI after
   RELEASE_MINUTES of owner silence. */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useBusiness } from "@/lib/business-context";
import { Avatar, Icon, phone, timeAgo } from "../ui";

type Conversation = {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  status: "agent" | "human";
  handed_off_at: string | null;
  last_message_at: string | null;
  last_preview: string | null;
};
type Msg = {
  direction: "in" | "out";
  sender: string;
  body: string | null;
  created_at: string;
  delivered: boolean;
};

const RELEASE_MINUTES = 120;
const minutesLeft = (handedOffAt: string) =>
  Math.max(0, Math.round(RELEASE_MINUTES - (Date.now() - new Date(handedOffAt).getTime()) / 60000));
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

export default function InboxPage() {
  const { business, error } = useBusiness();
  const [convs, setConvs] = useState<Conversation[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[] | null>(null);
  const [filter, setFilter] = useState<"all" | "you">("all");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(() => {
    if (!business) return;
    api<Conversation[]>(`businesses/${business.id}/conversations`).then((rows) => {
      setConvs(rows);
      setSelected((cur) => cur ?? rows.find((r) => r.status === "human")?.id ?? rows[0]?.id ?? null);
    });
  }, [business]);

  const loadMessages = useCallback(() => {
    if (!selected) return;
    api<Msg[]>(`conversations/${selected}/messages`).then((rows) => {
      setMessages(rows);
      setTimeout(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }), 30);
    });
  }, [selected]);

  useEffect(loadConvs, [loadConvs]);
  useEffect(() => {
    setMessages(null);
    loadMessages();
  }, [loadMessages]);
  useEffect(() => {
    const t = setInterval(() => {
      loadConvs();
      loadMessages();
    }, 10000);
    return () => clearInterval(t);
  }, [loadConvs, loadMessages]);

  const current = convs?.find((c) => c.id === selected) ?? null;
  const shown = (convs ?? []).filter(
    (c) =>
      (filter === "all" || c.status === "human") &&
      (!q || `${c.customer_name ?? ""} ${c.customer_phone}`.toLowerCase().includes(q.toLowerCase())),
  );
  const waiting = (convs ?? []).filter((c) => c.status === "human").length;

  async function toggleMode() {
    if (!current) return;
    setSendErr(null);
    try {
      await api(`conversations/${current.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: current.status === "human" ? "agent" : "human" }),
      });
    } catch (e) {
      setSendErr((e as Error).message);
    }
    loadConvs();
  }

  async function send() {
    if (!current || !draft.trim()) return;
    setBusy(true);
    setSendErr(null);
    try {
      await api(`conversations/${current.id}/reply`, { method: "POST", body: JSON.stringify({ body: draft.trim() }) });
      setDraft("");
      loadMessages();
      loadConvs();
    } catch (e) {
      setSendErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="sub">Could not reach the Footfall API: {error}</p>;

  let lastDay = "";
  return (
    <div className="card ib">
      <div className="ib-list">
        <div className="ib-list-h">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="seg">
              <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
                All chats
              </button>
              <button className={filter === "you" ? "on" : ""} onClick={() => setFilter("you")}>
                Needs you{waiting ? ` · ${waiting}` : ""}
              </button>
            </div>
          </div>
          <input placeholder="Search name or number" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="ib-items">
          {convs === null ? (
            <div className="empty">Loading…</div>
          ) : shown.length === 0 ? (
            <div className="empty">
              <b>{filter === "you" ? "Nothing waiting for you" : "No conversations yet"}</b>
              {filter === "you" ? "The AI is handling every chat." : "Chats appear here as customers message you."}
            </div>
          ) : (
            shown.map((c) => (
              <div key={c.id} className={`ib-item ${c.id === selected ? "on" : ""}`} onClick={() => setSelected(c.id)}>
                <Avatar name={c.customer_name ?? c.customer_phone} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div className="l1">
                    <b>{c.customer_name ?? phone(c.customer_phone)}</b>
                    <small>{c.last_message_at ? timeAgo(c.last_message_at) : ""}</small>
                  </div>
                  <p>{c.last_preview ?? "…"}</p>
                  {c.status === "human" && c.handed_off_at && (
                    <span className="pill human">Needs you · back to AI in {minutesLeft(c.handed_off_at)}m</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ib-thread">
        {!current ? (
          <div className="ib-empty">
            <div>
              <b>Pick a conversation</b>
              Every WhatsApp chat with your customers lives here.
            </div>
          </div>
        ) : (
          <>
            <div className="ib-thread-h">
              <Avatar name={current.customer_name ?? current.customer_phone} size={38} />
              <div className="grow" style={{ minWidth: 0 }}>
                <b>{current.customer_name ?? phone(current.customer_phone)}</b>
                <small>{phone(current.customer_phone)}</small>
              </div>
              <button className={`btn ${current.status === "agent" ? "ghost" : ""} sm`} onClick={toggleMode}>
                {current.status === "agent" ? "Take over" : "Hand back to AI"}
              </button>
            </div>
            <div className={`ib-banner ${current.status === "agent" ? "ai" : ""}`}>
              <Icon name={current.status === "agent" ? "sparkle" : "chat"} size={15} />
              {current.status === "agent"
                ? "The AI is replying to this customer. Type below to take over."
                : `You're replying. The AI steps back in after ${RELEASE_MINUTES / 60} hours of silence${current.handed_off_at ? ` (${minutesLeft(current.handed_off_at)}m left)` : ""}.`}
            </div>
            <div className="ib-msgs" ref={threadRef}>
              {messages === null ? (
                <div className="ib-empty">Loading…</div>
              ) : (
                messages.map((m, i) => {
                  const d = dayLabel(m.created_at);
                  const sep = d !== lastDay;
                  lastDay = d;
                  const mine = m.direction === "out";
                  return (
                    <div key={i} style={{ display: "contents" }}>
                      {sep && <div className="day-sep">{d}</div>}
                      <div className={`bubble ${mine ? "out" : "in"} ${mine && m.sender === "owner" ? "owner" : ""}`}>
                        {mine && <span className="who">{m.sender === "owner" ? "You" : "Footfall AI"}</span>}
                        {m.body ?? "…"}
                        <span className="meta">
                          {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                          {mine && !m.delivered && " · not delivered"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="ib-compose">
              <textarea
                rows={1}
                placeholder={current.status === "agent" ? "Type to take over from the AI…" : "Write a reply…"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button className="btn" onClick={send} disabled={busy || !draft.trim()}>
                Send
              </button>
            </div>
            {sendErr && <p style={{ color: "var(--danger)", fontSize: 12.5, margin: "0 18px 10px" }}>{sendErr}</p>}
          </>
        )}
      </div>
    </div>
  );
}
