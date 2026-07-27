import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VERTICALS, getVertical } from "@/lib/verticals";

export const dynamic = "force-static";

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const v = getVertical((await params).slug);
  if (!v) return {};
  return {
    title: v.title,
    description: v.description,
    keywords: v.keywords,
    alternates: { canonical: `https://getfootfall.com/for/${v.slug}` },
    openGraph: {
      title: v.title,
      description: v.description,
      url: `https://getfootfall.com/for/${v.slug}`,
      type: "website",
    },
  };
}

const FOREST = "#0b3d2e";
const DEEP = "#081f16";
const EMERALD = "#17a566";
const MARIGOLD = "#f0a02c";
const IVORY = "#eafff3";

export default async function VerticalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const v = getVertical((await params).slug);
  if (!v) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: v.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", background: "#f7faf7", color: "#132a20" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* nav */}
      <nav style={{ background: DEEP, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ color: IVORY, fontWeight: 800, fontSize: 19, textDecoration: "none", letterSpacing: "-0.03em" }}>
          footfall
        </Link>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <Link href="/login" style={{ color: IVORY, fontSize: 13, textDecoration: "none" }}>
            Sign in
          </Link>
          <Link
            href="/join"
            style={{ background: MARIGOLD, color: "#2e1f04", padding: "8px 18px", borderRadius: 99, fontWeight: 800, fontSize: 12.5, textDecoration: "none" }}
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* hero */}
      <header style={{ background: FOREST, color: IVORY, padding: "64px 24px 56px", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7df2a8", margin: "0 0 14px" }}>
          Footfall for {v.name.toLowerCase()}
        </p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 auto 18px", maxWidth: 780, lineHeight: 1.12 }}>
          {v.h1}
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, maxWidth: 640, margin: "0 auto 28px", color: "#cfe8d8" }}>
          {v.intro}
        </p>
        <Link
          href="/join"
          style={{ display: "inline-block", background: EMERALD, color: "#fff", padding: "14px 32px", borderRadius: 99, fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 2px 0 #0e7a49" }}
        >
          Start 14 days free
        </Link>
        <p style={{ fontSize: 12.5, color: "#9db8aa", marginTop: 12 }}>No card · we set it up for you · live in a day</p>
      </header>

      {/* pains */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "56px 24px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 32px" }}>
          What it handles for your {v.singular}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {v.pains.map((p) => (
            <div key={p.title} style={{ background: "#fff", border: "1px solid #e4ebe6", borderRadius: 16, padding: "22px 22px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px" }}>{p.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#5b6f64", margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* chat example */}
      <section style={{ background: FOREST, padding: "56px 24px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center", color: IVORY, margin: "0 0 8px" }}>
          A real conversation
        </h2>
        <p style={{ textAlign: "center", color: "#9db8aa", fontSize: 14, margin: "0 0 28px" }}>
          This is Footfall answering on a {v.singular}&apos;s WhatsApp — hands-free.
        </p>
        <div style={{ maxWidth: 480, margin: "0 auto", background: "#e6ddd2", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {v.chat.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.from === "customer" ? "flex-start" : "flex-end",
                background: m.from === "customer" ? "#fff" : "#d7f7c8",
                borderRadius: 12,
                padding: "10px 14px",
                maxWidth: "85%",
                fontSize: 14.5,
                lineHeight: 1.5,
                boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
      </section>

      {/* faq */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 28px" }}>
          Questions {v.name.toLowerCase()} ask us
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {v.faqs.map((f) => (
            <div key={f.q} style={{ background: "#fff", border: "1px solid #e4ebe6", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, margin: "0 0 6px" }}>{f.q}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "#5b6f64", margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* cta */}
      <section style={{ background: DEEP, color: IVORY, textAlign: "center", padding: "56px 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
          Never miss another booking.
        </h2>
        <p style={{ color: "#9db8aa", fontSize: 15, margin: "0 0 24px" }}>
          ₹1,499/month · 14 days free · one saved booking covers it
        </p>
        <Link
          href="/join"
          style={{ display: "inline-block", background: MARIGOLD, color: "#2e1f04", padding: "14px 34px", borderRadius: 99, fontWeight: 800, fontSize: 15, textDecoration: "none" }}
        >
          Get my WhatsApp receptionist
        </Link>

        {/* internal links — every vertical reachable from every vertical */}
        <div style={{ marginTop: 44, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9db8aa", marginBottom: 12 }}>
            Footfall works for
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 18px", maxWidth: 720, margin: "0 auto" }}>
            {VERTICALS.map((o) => (
              <Link
                key={o.slug}
                href={`/for/${o.slug}`}
                style={{ color: o.slug === v.slug ? MARIGOLD : "#cfe8d8", fontSize: 13.5, textDecoration: "none" }}
              >
                {o.name}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: "#9db8aa", marginTop: 26 }}>
            getfootfall.com · by BlackSpace AI · <Link href="/privacy" style={{ color: "#9db8aa" }}>Privacy</Link> · <Link href="/terms" style={{ color: "#9db8aa" }}>Terms</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
