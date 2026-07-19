import { NextRequest, NextResponse } from "next/server";

// Server-side proxy to the FastAPI owner API. The admin key lives only in
// server env — the browser never sees it. Replaced by per-user Supabase JWT
// auth once the Footfall Supabase project exists.

const API = process.env.FOOTFALL_API_URL ?? "http://127.0.0.1:8001";
const KEY = process.env.FOOTFALL_ADMIN_KEY ?? "";

export const dynamic = "force-dynamic";

async function forward(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const url = new URL(`${API}/api/v1/owner/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${KEY}`,
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
