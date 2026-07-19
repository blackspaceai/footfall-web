"use client";

import { useEffect, useState } from "react";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`/api/f/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
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

/** First (currently only) business for this owner. */
export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Business[]>("businesses")
      .then((rows) => setBusiness(rows[0] ?? null))
      .catch((e) => setError(e.message));
  }, []);
  return { business, error };
}

export const rupees = (minor: number) => `₹${(minor / 100).toLocaleString("en-IN")}`;
