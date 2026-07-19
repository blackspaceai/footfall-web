"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
          setMsg("Check your email to confirm your account, then sign in.");
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
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="db" style={{ alignItems: "center", justifyContent: "center" }}>
      <div className="db-card" style={{ width: 380, padding: "30px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/footfall-mark-transparent.svg" alt="" style={{ height: 26 }} />
          <b style={{ fontSize: 19 }}>footfall</b>
        </div>
        <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>
          {mode === "in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="sub">Your WhatsApp receptionist&apos;s control room.</p>

        {!supabaseConfigured ? (
          <p style={{ fontSize: 13.5, color: "#b3442e", lineHeight: 1.6 }}>
            Supabase is not configured yet — set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.
          </p>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button className="btn" disabled={busy}>
              {busy ? "…" : mode === "in" ? "Sign in" : "Sign up"}
            </button>
            {msg && <p style={{ fontSize: 13, color: "#8a6414", margin: 0 }}>{msg}</p>}
            <button
              type="button"
              className="btn ghost"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
