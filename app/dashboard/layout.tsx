"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/services", label: "Services & products" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/hours", label: "Hours" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
