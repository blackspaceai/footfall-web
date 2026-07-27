import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Script from "next/script";
import { VERTICALS } from "@/lib/verticals";

// The marketing page is the exported Footfall design. Its (large) stylesheet
// is served as a cached static file; only the markup is inlined.
export const dynamic = "force-static";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://getfootfall.com/#org",
      name: "Footfall",
      url: "https://getfootfall.com/",
      logo: "https://getfootfall.com/logo/footfall-app-icon.svg",
      parentOrganization: { "@type": "Organization", name: "BlackSpace AI" },
      address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Footfall — WhatsApp AI receptionist",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      url: "https://getfootfall.com/",
      description:
        "AI receptionist on WhatsApp for salons, spas, clinics, doctors, dentists, hospitals and gyms: answers every message in seconds, books appointments, sends reminders and chases no-shows.",
      offers: {
        "@type": "Offer",
        price: "1499",
        priceCurrency: "INR",
        description: "₹1,499 per month after a 14-day free trial",
      },
      publisher: { "@id": "https://getfootfall.com/#org" },
    },
  ],
};

export default function MarketingPage() {
  const dir = path.join(process.cwd(), "marketing");
  const links = fs.readFileSync(path.join(dir, "links.html"), "utf-8");
  const body = fs.readFileSync(path.join(dir, "body.html"), "utf-8");
  return (
    <>
      <link rel="stylesheet" href="/marketing.css" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <div dangerouslySetInnerHTML={{ __html: links + body }} />

      {/* Crawlable vertical links — the SEO path from the homepage into every
          /for/* landing page. Styled to sit naturally under the exported design. */}
      <section
        style={{
          background: "#081f16",
          padding: "36px 24px 44px",
          textAlign: "center",
          fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
        }}
      >
        <h2
          style={{
            color: "#eafff3",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "0 0 6px",
          }}
        >
          One AI receptionist. Every appointment business.
        </h2>
        <p style={{ color: "#9db8aa", fontSize: 13.5, margin: "0 0 20px" }}>
          See how Footfall works for your kind of business:
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px 12px",
            maxWidth: 860,
            margin: "0 auto",
          }}
        >
          {VERTICALS.map((v) => (
            <Link
              key={v.slug}
              href={`/for/${v.slug}`}
              style={{
                color: "#cfe8d8",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 99,
                padding: "8px 16px",
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              AI for {v.name.toLowerCase()}
            </Link>
          ))}
        </div>
      </section>

      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
