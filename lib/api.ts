"use client";

export class LoginRequired extends Error {}

/** A failed API call. Sign-up errors carry a machine-readable `code`
    (already_claimed, similar_exists, phone_taken, …) plus extra fields. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | null,
    message: string,
    public data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`/api/f/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (resp.status === 401) {
    window.location.href = "/login";
    throw new LoginRequired("login required");
  }
  if (!resp.ok) {
    let detail: unknown = resp.statusText;
    try {
      detail = (await resp.json()).detail ?? detail;
    } catch {}
    if (detail && typeof detail === "object" && "message" in detail) {
      const d = detail as Record<string, unknown>;
      throw new ApiError(resp.status, (d.code as string) ?? null, String(d.message), d);
    }
    throw new ApiError(
      resp.status,
      null,
      typeof detail === "string" ? detail : JSON.stringify(detail),
    );
  }
  if (resp.status === 204) return undefined as T;
  return resp.json();
}

export type Role = "owner" | "manager" | "staff";

export type Business = {
  id: string;
  name: string;
  category: string;
  timezone: string;
  owner_wa_phone: string | null;
  is_live: boolean;
  role: Role;
  plan: string;
  verification_status: "unverified" | "pending_review" | "verified";
  place_address: string | null;
};

export type Me = {
  user_id: string;
  phone: string | null;
  phone_verified: boolean;
  otp_available: boolean;
  otp_channels: string[];
  places_available: boolean;
  is_superadmin: boolean;
};

export async function createBusiness(input: {
  name: string;
  category: string;
  owner_wa_phone?: string;
  google_place_id?: string;
  places_session?: string;
  pincode?: string;
  confirm_distinct?: boolean;
}): Promise<Business> {
  return api<Business>("businesses", { method: "POST", body: JSON.stringify(input) });
}

export const rupees = (minor: number) => `₹${(minor / 100).toLocaleString("en-IN")}`;
