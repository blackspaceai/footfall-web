import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy — Footfall" };

const S = {
  page: { maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", color: "#10241b", lineHeight: 1.7 } as React.CSSProperties,
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 },
  h2: { fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 8 },
  muted: { color: "#5f7d6e", fontSize: 14 },
};

export default function PrivacyPage() {
  return (
    <main style={S.page}>
      <p style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: "#0f6e56", fontWeight: 700, textDecoration: "none" }}>← Footfall</Link>
      </p>
      <h1 style={S.h1}>Privacy Policy</h1>
      <p style={S.muted}>Footfall, a product of BlackSpace AI · Last updated 22 July 2026</p>

      <h2 style={S.h2}>Who we are</h2>
      <p>
        Footfall is a product of <b>BlackSpace AI</b> (&ldquo;we&rdquo;, &ldquo;us&rdquo;). Footfall provides an AI receptionist on WhatsApp for
        service businesses in India — it answers customer inquiries, quotes prices, books
        appointments, and sends reminders on behalf of the businesses that subscribe to us
        (&ldquo;Businesses&rdquo;). This policy covers both Business account holders and the
        customers who message a Business&rsquo;s WhatsApp number (&ldquo;End Customers&rdquo;).
      </p>

      <h2 style={S.h2}>What we collect</h2>
      <p>
        <b>From Businesses:</b> account email, business name and category, team member names,
        services and prices, opening hours, and a WhatsApp Business phone number connection.
        <br />
        <b>From End Customers:</b> the WhatsApp phone number and profile name, the content of
        messages sent to the Business&rsquo;s number, and booking details (service, date, time).
        We collect this so the AI receptionist can respond and manage bookings — the purpose the
        End Customer is contacting the Business for.
      </p>

      <h2 style={S.h2}>How messages are processed</h2>
      <p>
        Messages are delivered to us by Meta&rsquo;s WhatsApp Business Platform and processed by an
        AI model (Anthropic&rsquo;s Claude) to generate replies and take booking actions. Message
        content is used to serve the conversation — not to train AI models, and not for
        advertising. Conversation history is retained so the Business can view its own customer
        conversations and so context is kept across a booking.
      </p>

      <h2 style={S.h2}>Where data lives</h2>
      <p>
        Data is stored with Supabase (database, Mumbai region, India) and processed on Vercel
        (application hosting, Mumbai region). Message transport is provided by Meta Platforms
        (WhatsApp Business Platform). AI processing is provided by Anthropic. Each provider
        processes data under its own security and privacy commitments.
      </p>

      <h2 style={S.h2}>Sharing</h2>
      <p>
        We do not sell personal data. End Customer conversations and bookings are visible to the
        Business they contacted. We share data only with the processors named above, as needed to
        run the service, or where the law requires.
      </p>

      <h2 style={S.h2}>Retention &amp; deletion</h2>
      <p>
        Businesses can request deletion of their account and all associated data (including End
        Customer conversations) at any time. End Customers may request deletion of their
        conversation history by contacting the Business or emailing us. We honour requests within
        30 days.
      </p>

      <h2 style={S.h2}>Opting out</h2>
      <p>
        End Customers can stop receiving messages from a Business at any time — reply
        &ldquo;STOP&rdquo; and reminders and follow-ups from that Business will cease.
      </p>

      <h2 style={S.h2}>Contact</h2>
      <p>
        Questions or requests: <b>contact@blackspace.ai</b>. We are based in India and this
        policy is governed by Indian law, including the Digital Personal Data Protection Act,
        2023 as applicable.
      </p>
    </main>
  );
}
