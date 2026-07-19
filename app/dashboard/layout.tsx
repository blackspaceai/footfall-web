"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/services", label: "Services & products" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/hours", label: "Hours" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
        <div className="foot">by BlackSpace AI</div>
      </aside>
      <main className="db-main">{children}</main>
    </div>
  );
}
