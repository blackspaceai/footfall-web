"use client";

/* Shared pieces of the dashboard design system: icons, avatar, wordmark,
   status pill, drawer. Styles live in dashboard.css. */

import { useEffect } from "react";
import { createPortal } from "react-dom";

const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-5v6h-4A1.5 1.5 0 0 1 4 19v-8.5Z" />,
  calendar: <path d="M8 3v3M16 3v3M3.5 9.5h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5v12.5A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6.5A1.5 1.5 0 0 1 5 5Zm3 8h2m3 0h2m-7 3.5h2m3 0h2" />,
  inbox: <path d="M4 13.5h4l1.5 3h5l1.5-3h4M5.5 5h13l2 8.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18v-4.5L5.5 5Z" />,
  list: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  chart: <path d="M4 20V11M10 20V5M16 20v-7M21 20H3" />,
  box: <path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9ZM12 12v9M12 12 4 7.5M12 12l8-4.5" />,
  team: <path d="M16 19.5v-1.2a3.3 3.3 0 0 0-3.3-3.3H7.3A3.3 3.3 0 0 0 4 18.3v1.2M10 11a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM20 19.5v-1a3.2 3.2 0 0 0-2.4-3.1M15.5 4.6a3.25 3.25 0 0 1 0 6" />,
  clock: <path d="M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 12a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.6 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />,
  shield: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Zm-3 9 2 2 4-4.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  left: <path d="m14.5 6-6 6 6 6" />,
  right: <path d="m9.5 6 6 6-6 6" />,
  down: <path d="m6 9.5 6 6 6-6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  search: <path d="m20 20-4.2-4.2M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />,
  logout: <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16.5 14.5 12 10 7.5M14.5 12H4" />,
  bell: <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9ZM10.3 20a2 2 0 0 0 3.4 0" />,
  sparkle: <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.9L12 18.5l-1.8-5.8-5.7-1.9L10.2 9 12 3.5ZM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />,
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  users: <path d="M17 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M10 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1.4a3.6 3.6 0 0 0-2.7-3.5M16.5 3.6a3.5 3.5 0 0 1 0 6.8" />,
  rupee: <path d="M7 4.5h10M7 9h10M7 4.5h3.5a4.25 4.25 0 0 1 0 8.5H7l7.5 7" />,
  alert: <path d="M12 9v4m0 3.5h.01M10.3 4.3 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />,
  chat: <path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 21l1.4-4.4A8.5 8.5 0 1 1 20.5 12Z" />,
  map: <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  phone: <path d="M8.2 3.5H5.5a2 2 0 0 0-2 2.1C4.1 14 10 19.9 18.4 20.5a2 2 0 0 0 2.1-2v-2.7l-4-1.7-2 2a12 12 0 0 1-6.6-6.6l2-2-1.7-4Z" />,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-8.5-9h17M12 3c2.3 2.4 3.5 5.4 3.5 9s-1.2 6.6-3.5 9c-2.3-2.4-3.5-5.4-3.5-9S9.7 5.4 12 3Z" />,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
};

export function Icon({ name, size = 18, className }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* The kit's wordmark (footfall-wordmark.svg) inline, minus its background,
   so it renders in Bricolage instead of an <img> fallback font. */
export function Wordmark({ height = 30, light = true }: { height?: number; light?: boolean }) {
  const ink = light ? "#eafff3" : "#0b3d2e";
  return (
    <svg height={height} viewBox="22 30 330 66" role="img" aria-label="footfall">
      <defs>
        <linearGradient id="wm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe8bf" />
          <stop offset="1" stopColor="#f0a02c" />
        </linearGradient>
      </defs>
      <text x="30" y="86" fontSize="72" fontWeight="800" letterSpacing="-2.5" fill={ink} fontFamily="'Bricolage Grotesque','Arial Black',sans-serif">
        fo
      </text>
      <path d="M 112 88 L 112 52 A 21 21 0 0 1 154 52 L 154 88 Z" fill="url(#wm-g)" />
      <circle cx="133" cy="70" r="6.5" fill="#0b3d2e" />
      <path d="M 123 88 L 123 82 A 10 10 0 0 1 143 82 L 143 88 Z" fill="#0b3d2e" />
      <text x="160" y="86" fontSize="72" fontWeight="800" letterSpacing="-2.5" fill={ink} fontFamily="'Bricolage Grotesque','Arial Black',sans-serif">
        tfall
      </text>
    </svg>
  );
}

const AVA = ["#149c60", "#3c68c0", "#b0642f", "#7d5bb5", "#c04f6e", "#2f8f9c", "#8a6a12"];
export const avaColor = (name: string) =>
  AVA[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVA.length];
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w && /[\p{L}\d]/u.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="ava" style={{ width: size, height: size, background: avaColor(name), fontSize: Math.round(size * 0.38) }}>
      {initials(name)}
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};
export function StatusPill({ status }: { status: string }) {
  return <span className={`pill ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function Drawer({
  title,
  sub,
  onClose,
  children,
  footer,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-h">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer-b">{children}</div>
        {footer && <div className="drawer-f">{footer}</div>}
      </aside>
    </>,
    document.body,
  );
}

export const rupeesShort = (minor: number) => {
  const r = minor / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(r >= 1000000 ? 0 : 1)}L`;
  if (r >= 10000) return `₹${(r / 1000).toFixed(0)}k`;
  return `₹${r.toLocaleString("en-IN")}`;
};

/* "919876500012" → "+91 98765 00012" */
export const phone = (p: string | null | undefined) => {
  if (!p) return "";
  const d = p.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return `+${d}`;
};

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
