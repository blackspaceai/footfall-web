"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import { BusinessProvider, useBusiness } from "@/lib/business-context";

const I = {
  today: <path d="M8 2v3M16 2v3M3.5 9h17M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" />,
  inbox: <path d="M3.5 13.5h4l1.5 3h6l1.5-3h4M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V7A1.5 1.5 0 0 1 5 5.5Z" />,
  bookings: <path d="M4 6.5h16M4 12h16M4 17.5h10" />,
  insights: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  services: <path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9ZM12 12v9M12 12 4 7.5M12 12l8-4.5" />,
  team: <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5A3.25 3.25 0 1 0 10 4a3.25 3.25 0 0 0 0 6.5ZM20 19v-1.2a3.2 3.2 0 0 0-2.5-3.1M15 4.2a3.25 3.25 0 0 1 0 6.1" />,
  hours: <path d="M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5.4 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />,
};

function Icon({ d }: { d: React.ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

const NAV = [
  { href: "/dashboard", label: "Today", icon: I.today },
  { href: "/dashboard/inbox", label: "Inbox", icon: I.inbox },
  { href: "/dashboard/bookings", label: "Bookings", icon: I.bookings },
  { href: "/dashboard/insights", label: "Insights", icon: I.insights },
  { href: "/dashboard/services", label: "Services & products", icon: I.services },
  { href: "/dashboard/team", label: "Team", icon: I.team },
  { href: "/dashboard/hours", label: "Hours", icon: I.hours },
  { href: "/dashboard/settings", label: "Settings", icon: I.settings },
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
              <Icon d={item.icon} />
              <span>{item.label}</span>
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
