"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, LoginRequired, type Business } from "./api";

type Ctx = {
  business: Business | null;
  businesses: Business[];
  loaded: boolean;
  error: string | null;
  refresh: () => void;
  select: (id: string) => void;
};

const BusinessCtx = createContext<Ctx | null>(null);
const STORE_KEY = "footfall.business";

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<Business[]>("businesses")
      .then((rows) => {
        setBusinesses(rows);
        setSelectedId((prev) => {
          const stored =
            prev ?? (typeof window !== "undefined" ? localStorage.getItem(STORE_KEY) : null);
          return rows.some((b) => b.id === stored) ? stored : (rows[0]?.id ?? null);
        });
        setLoaded(true);
      })
      .catch((e) => {
        if (!(e instanceof LoginRequired)) setError((e as Error).message);
      });
  }, []);
  useEffect(refresh, [refresh]);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    try {
      localStorage.setItem(STORE_KEY, id);
    } catch {}
  }, []);

  const business = businesses.find((b) => b.id === selectedId) ?? null;

  return (
    <BusinessCtx.Provider value={{ business, businesses, loaded, error, refresh, select }}>
      {children}
    </BusinessCtx.Provider>
  );
}

export function useBusiness(): Ctx {
  const ctx = useContext(BusinessCtx);
  if (!ctx) throw new Error("useBusiness must be used inside BusinessProvider");
  return ctx;
}
