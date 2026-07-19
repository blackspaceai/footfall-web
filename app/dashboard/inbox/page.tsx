"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, useBusiness } from "@/lib/api";

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

function minutesLeft(handedOffAt: string): number {
  const elapsed = (Date.now() - new Date(handedOffAt).getTime()) / 60000;
  return Math.max(0, Math.round(RELEASE_MINUTES - elapsed));
}

export default function InboxPage() {
  const { business, error } = useBusiness();
  const [convs, setConvs] = useState<Conversation[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(() => {
    if (!business) return;
    api<Conversation[]>(`businesses/${business.id}/conversations`).then(setConvs);
  }, [business]);

  const loadMessages = useCallback(() => {
    if (!selected) return;
    api<Msg[]>(`conversations/${selected}/messages`).then((rows) => {
      setMessages(rows);
      setTimeout(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
      }, 50);
    });
  }, [selected]);

  useEffect(loadConvs, [loadConvs]);
  useEffect(loadMessages, [loadMessages]);
  useEffect(() => {
    const t = setInterval(() => {
      loadConvs();
      loadMessages();
    }, 10000);
    return () => clearInterval(t);
  }, [loadConvs, loadMessages]);

  const current = convs?.find((c) => c.id === selected) ?? null;

  async function toggleMode() {
    if (!current) return;
    await api(`conversations/${current.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: current.status === "human" ? "agent" : "human" }),
    });
    loadConvs();
  }

  async function send() {
    if (!current || !draft.trim()) return;
    setBusy(true);
    setSendErr(null);
    try {
      await api(`conversations/${current.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: draft.trim() }),
      });
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

  return (
    <>
      <h1>Inbox</h1>
      <p className="sub">
        Every WhatsApp conversation. Amber ones are waiting for you — reply to take over, or
        they return to the agent after {RELEASE_MINUTES / 60} hours.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 14 }}>
        <div className="db-card" style={{ padding: 10, maxHeight: 560, overflowY: "auto" }}>
          {convs === null ? (
            <div className="empty">Loading…</div>
          ) : convs.length === 0 ? (
            <div className="empty">No conversations yet.</div>
          ) : (
            convs.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background:
                    c.id === selected
                      ? "var(--paper)"
                      : c.status === "human"
                        ? "#fdf9ef"
                        : "transparent",
                  border:
                    c.status === "human" ? "1px solid #f0d9a0" : "1px solid transparent",
                  marginBottom: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <b style={{ fontSize: 13.5 }}>{c.customer_name ?? c.customer_phone}</b>
                  {c.status === "human" && c.handed_off_at && (
                    <span className="pill" style={{ background: "#fdf3d8", color: "#8a6414" }}>
                      needs you · {minutesLeft(c.handed_off_at)}m
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.last_preview ?? "…"}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="db-card" style={{ display: "flex", flexDirection: "column", maxHeight: 560 }}>
          {!current ? (
            <div className="empty">Pick a conversation.</div>
          ) : (
            <>
              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <b>{current.customer_name ?? current.customer_phone}</b>
                  <span style={{ marginLeft: 10 }} className={`pill ${current.status === "agent" ? "confirmed" : "product"}`}>
                    {current.status === "agent" ? "agent answering" : "with you"}
                  </span>
                </div>
                <button className="btn ghost" onClick={toggleMode}>
                  {current.status === "agent" ? "Take over" : "Hand back to agent"}
                </button>
              </div>

              <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "4px 2px" }}>
                {messages === null ? (
                  <div className="empty">Loading…</div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: m.direction === "in" ? "flex-start" : "flex-end",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "75%",
                          padding: "8px 12px",
                          borderRadius:
                            m.direction === "in" ? "12px 12px 12px 4px" : "12px 12px 4px 12px",
                          background: m.direction === "in" ? "var(--paper)" : "#d9f2e4",
                          fontSize: 13.5,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: "var(--muted)",
                            marginBottom: 2,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {m.direction === "in"
                            ? "customer"
                            : m.sender === "owner"
                              ? "you"
                              : "agent"}
                          {m.direction === "out" && !m.delivered && " · not delivered"}
                        </div>
                        {m.body ?? "…"}
                        <div style={{ fontSize: 10.5, color: "var(--muted)", textAlign: "right" }}>
                          {new Date(m.created_at).toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <input
                  style={{ flex: 1 }}
                  placeholder="Reply as the owner… (takes the conversation over)"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <button className="btn" onClick={send} disabled={busy || !draft.trim()}>
                  Send
                </button>
              </div>
              {sendErr && (
                <p style={{ color: "#b3442e", fontSize: 12.5, margin: "6px 0 0" }}>{sendErr}</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
