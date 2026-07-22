"use client";

export class LoginRequired extends Error {}

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
    let detail = resp.statusText;
    try {
      detail = (await resp.json()).detail ?? detail;
    } catch {}
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (resp.status === 204) return undefined as T;
  return resp.json();
}

export type Business = {
  id: string;
  name: string;
  category: string;
  timezone: string;
  owner_wa_phone: string | null;
  is_live: boolean;
};

export async function createBusiness(input: {
  name: string;
  category: string;
  owner_wa_phone?: string;
}): Promise<Business> {
  return api<Business>("businesses", { method: "POST", body: JSON.stringify(input) });
}

export const rupees = (minor: number) => `₹${(minor / 100).toLocaleString("en-IN")}`;
