import { NextRequest, NextResponse } from "next/server";
import { supabaseConfiguredServer, supabaseServer } from "@/lib/supabase/server";

// Server-side proxy to the FastAPI owner API. When Supabase is configured,
// the signed-in user's JWT is forwarded (FastAPI scopes to their
// businesses). Without Supabase config (local dev), it falls back to the
// admin key — which never reaches the browser either way.

const API = process.env.FOOTFALL_API_URL ?? "http://127.0.0.1:8001";
const ADMIN_KEY = process.env.FOOTFALL_ADMIN_KEY ?? "";

export const dynamic = "force-dynamic";

async function bearerToken(): Promise<string | null> {
  if (supabaseConfiguredServer()) {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
  return ADMIN_KEY || null;
}

async function forward(req: NextRequest, params: Promise<{ path: string[] }>) {
  const token = await bearerToken();
  if (!token) {
    return NextResponse.json({ detail: "login_required" }, { status: 401 });
  }
  const { path } = await params;
  const url = new URL(`${API}/api/v1/owner/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (req.method !== "GET" && req.method !== "DELETE") {
    init.body = await req.text();
  }
  const resp = await fetch(url, init);
  const text = await resp.text();
  return new NextResponse(text || null, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
