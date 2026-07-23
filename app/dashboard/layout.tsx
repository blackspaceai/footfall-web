"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import { BusinessProvider, useBusiness } from "@/lib/business-context";

const NAV = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/inbox", label: "Inbox" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/insights", label: "Insights" },
  { href: "/dashboard/services", label: "Services & products" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/hours", label: "Hours" },
  { href: "/dashboard/settings", label: "Settings" },
];

function BusinessSwitcher() {
  const { business, businesses, select } = useBusiness();
  if (businesses.length < 2) return null;
  return (
    <select
      value={business?.id ?? ""}
      onChange={(e) => select(e.target.value)}
      style={{
        margin: "0 0 14px",
        width: "100%",
        background: "rgba(125, 242, 168, 0.08)",
        color: "var(--ivory, #eafff3)",
        border: "1px solid rgba(143, 212, 180, 0.3)",
        borderRadius: 9,
        padding: "8px 10px",
        fontSize: 13.5,
        fontWeight: 600,
      }}
    >
      {businesses.map((b) => (
        <option key={b.id} value={b.id} style={{ color: "#10241b" }}>
          {b.name}
        </option>
      ))}
    </select>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!supabaseConfigured) return; // dev mode without Supabase — no gate
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) router.replace("/login");
      });
  }, [router]);

  async function signOut() {
    if (supabaseConfigured) await supabaseBrowser().auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="db">
      <aside className="db-side">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/footfall-mark-transparent.svg" alt="" />
          footfall
        </div>
        <BusinessSwitcher />
        <nav>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="foot">
          {supabaseConfigured && (
            <a onClick={signOut} style={{ cursor: "pointer", display: "block", marginBottom: 8 }}>
              Sign out
            </a>
          )}
          by BlackSpace AI
        </div>
      </aside>
      <main className="db-main">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <Shell>{children}</Shell>
    </BusinessProvider>
  );
}
