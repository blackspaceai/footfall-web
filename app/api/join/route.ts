import { NextRequest, NextResponse } from "next/server";

// Public lead capture — forwards the landing-page waitlist form to the
// FastAPI /leads endpoint. Unauthenticated by design (no token, unlike the
// /api/f owner proxy); the API rate-limits this path.

const API = process.env.FOOTFALL_API_URL ?? "http://127.0.0.1:8001";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request." }, { status: 400 });
  }
  const resp = await fetch(`${API}/api/v1/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  return new NextResponse(text || null, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
}
