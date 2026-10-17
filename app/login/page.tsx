"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import { Wordmark } from "../dashboard/ui";
import "../dashboard/dashboard.css";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) return;
    setBusy(true);
    setMsg(null);
    const supabase = supabaseBrowser();
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setMsg({ text: "Check your email to confirm your account, then sign in." });
          setMode("in");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMsg({ text: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="db auth">
      <aside className="auth-art">
        <Wordmark height={30} />
        <h2>Your front desk, open all night.</h2>
        <p>Footfall answers your WhatsApp, quotes from your menu and books the slot — in English, Hindi or Telugu. You see every booking here.</p>
        <div className="auth-chat" aria-hidden>
          <div className="in">Hi, haircut tomorrow around 5?</div>
          <div className="out">Anu is free at 5:00 pm — haircut ₹500. Shall I book it?</div>
          <div className="in">Yes please 🙏</div>
          <div className="out">Booked ✅ See you tomorrow at 5:00 pm.</div>
        </div>
        <small className="auth-foot">
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
        </small>
      </aside>

      <main className="auth-form">
        <div className="auth-card">
          <div className="auth-mobile-mark">
            <Wordmark height={26} light={false} />
          </div>
          <h1>{mode === "in" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted" style={{ margin: "0 0 22px", fontSize: 14 }}>
            {mode === "in" ? "Sign in to see today's bookings and chats." : "Takes a minute. Your AI receptionist starts on a free trial."}
          </p>

          {!supabaseConfigured ? (
            <p style={{ fontSize: 13.5, color: "var(--danger)", lineHeight: 1.6 }}>
              Supabase is not configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev
              server.
            </p>
          ) : (
            <form onSubmit={submit} className="auth-fields">
              <label className="field">
                Email
                <input type="email" autoComplete="email" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="field">
                Password
                <input
                  type="password"
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  placeholder={mode === "in" ? "Your password" : "At least 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </label>
              <button className="btn accent" disabled={busy} style={{ width: "100%", justifyContent: "center", height: 44, fontSize: 14.5 }}>
                {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
              </button>
              {msg && <p style={{ fontSize: 13, margin: 0, color: msg.error ? "var(--danger)" : "var(--emerald-dark)" }}>{msg.text}</p>}
            </form>
          )}

          <p className="auth-switch">
            {mode === "in" ? "New to Footfall?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => (setMode(mode === "in" ? "up" : "in"), setMsg(null))}>
              {mode === "in" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
