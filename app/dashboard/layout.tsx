"use client";

import "./dashboard.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import { BusinessProvider, useBusiness } from "@/lib/business-context";
import { AlertsProvider, useAlerts } from "@/lib/alerts";
import { api, type Me, type Role } from "@/lib/api";
import { AlertsBell } from "./alerts-bell";
import { BookingsProvider, useBookings } from "./booking-drawers";
import { Onboarding } from "./onboarding";
import { Icon, Wordmark } from "./ui";

const RANK: Record<Role, number> = { staff: 1, manager: 2, owner: 3 };

type NavItem = { href: string; label: string; icon: string; minRole?: Role; badge?: "inbox" };
const NAV: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/dashboard", label: "Home", icon: "home" },
      { href: "/dashboard/calendar", label: "Calendar", icon: "calendar" },
      { href: "/dashboard/inbox", label: "Inbox", icon: "inbox", badge: "inbox" },
      { href: "/dashboard/bookings", label: "Bookings", icon: "list" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/dashboard/insights", label: "Insights", icon: "chart", minRole: "manager" },
      { href: "/dashboard/services", label: "Services & products", icon: "box" },
      { href: "/dashboard/team", label: "Team", icon: "team" },
      { href: "/dashboard/hours", label: "Opening hours", icon: "clock" },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: "settings" }],
  },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/calendar": "Calendar",
  "/dashboard/inbox": "Inbox",
  "/dashboard/bookings": "Bookings",
  "/dashboard/insights": "Insights",
  "/dashboard/services": "Services & products",
  "/dashboard/team": "Team",
  "/dashboard/hours": "Opening hours",
  "/dashboard/settings": "Settings",
  "/dashboard/admin": "Admin",
};

const bizInitial = (name?: string) => (name ?? "?").trim()[0]?.toUpperCase() ?? "?";

function BusinessSwitcher() {
  const { business, businesses, select } = useBusiness();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  if (!business) return null;
  const many = businesses.length > 1;
  return (
    <div className="biz" ref={ref}>
      <button className="biz-btn" onClick={() => many && setOpen((o) => !o)} style={{ cursor: many ? "pointer" : "default" }}>
        <span className="biz-ava">{bizInitial(business.name)}</span>
        <span className="biz-meta">
          <b>{business.name}</b>
          <small>
            <i className={`live-dot ${business.is_live ? "" : "off"}`} />
            {business.is_live ? "AI receptionist live" : "AI paused"}
            {business.role !== "owner" && ` · ${business.role}`}
          </small>
        </span>
        {many && <Icon name="down" size={16} />}
      </button>
      {open && (
        <div className="biz-menu">
          {businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                select(b.id);
                setOpen(false);
              }}
            >
              <span className="biz-ava">{bizInitial(b.name)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{b.name}</span>
              {b.id === business.id && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useNeedsYou(): number {
  const { business } = useBusiness();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!business) return;
    const load = () =>
      api<{ status: string }[]>(`businesses/${business.id}/conversations`)
        .then((rows) => setN(rows.filter((r) => r.status === "human").length))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [business]);
  return n;
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { disablePush } = useAlerts();
  const { business, loaded, refresh } = useBusiness();
  const { openNew } = useBookings();
  const needsYou = useNeedsYou();
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    api<Me>("me").then(setMe).catch(() => {});
    if (!supabaseConfigured) {
      setEmail("Local preview");
      return;
    }
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) router.replace("/login");
        else setEmail(data.session.user.email ?? "");
      });
  }, [router]);

  async function signOut() {
    // A shared computer must not keep buzzing with the last owner's bookings.
    await disablePush().catch(() => {});
    if (supabaseConfigured) await supabaseBrowser().auth.signOut();
    router.replace("/login");
  }

  const role: Role = business?.role ?? "owner";
  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.minRole || RANK[role] >= RANK[i.minRole]),
  }));
  if (me?.is_superadmin) {
    groups[2].items = [...groups[2].items, { href: "/dashboard/admin", label: "Admin", icon: "shield" }];
  }
  const hasBusiness = Boolean(business);
  const title = TITLES[pathname] ?? "";

  if (loaded && !hasBusiness && pathname !== "/dashboard/admin") {
    return (
      <div className="db ob-shell">
        <Onboarding
          onDone={() => {
            refresh();
            router.push("/dashboard");
          }}
          account={email}
          onSignOut={supabaseConfigured ? signOut : undefined}
        />
      </div>
    );
  }

  return (
    <div className="db">
      <aside className="db-side">
        <Link href="/dashboard" className="brand" aria-label="Footfall home">
          <Wordmark height={30} />
        </Link>
        <BusinessSwitcher />
        {hasBusiness && (
          <nav>
            {groups.map((g, gi) => (
              <div key={gi} style={{ display: "contents" }}>
                {g.label && <div className="nav-label">{g.label}</div>}
                {g.items.map((item) => (
                  <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                    {item.badge === "inbox" && needsYou > 0 && <span className="nav-badge">{needsYou}</span>}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        )}
        <div className="side-foot">
          <span className="me-ava">{(email || "?")[0].toUpperCase()}</span>
          <span className="me">
            <b>{email || "…"}</b>
            <small>{me?.is_superadmin ? "BlackSpace admin" : `Signed in · ${role}`}</small>
          </span>
          {supabaseConfigured && (
            <button className="icon-btn" onClick={signOut} title="Sign out" aria-label="Sign out">
              <Icon name="logout" />
            </button>
          )}
        </div>
      </aside>
      <main className="db-main">
        {hasBusiness && (
          <header className="topbar">
            <div>
              <h1>{title}</h1>
            </div>
            <span className="spacer" />
            <AlertsBell />
            <button className="btn accent" onClick={() => openNew()}>
              <Icon name="plus" size={16} />
              New booking
            </button>
          </header>
        )}
        <div className={`page ${pathname === "/dashboard/calendar" || pathname === "/dashboard/admin" ? "wide" : ""}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <AlertsProvider>
        <BookingsProvider>
          <Shell>{children}</Shell>
        </BookingsProvider>
      </AlertsProvider>
    </BusinessProvider>
  );
}
