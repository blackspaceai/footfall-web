import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service — Footfall" };

const S = {
  page: { maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", color: "#10241b", lineHeight: 1.7 } as React.CSSProperties,
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 },
  h2: { fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 8 },
  muted: { color: "#5f7d6e", fontSize: 14 },
};

export default function TermsPage() {
  return (
    <main style={S.page}>
      <p style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: "#0f6e56", fontWeight: 700, textDecoration: "none" }}>← Footfall</Link>
      </p>
      <h1 style={S.h1}>Terms of Service</h1>
      <p style={S.muted}>Footfall, a product of BlackSpace AI · Last updated 22 July 2026</p>

      <h2 style={S.h2}>The service</h2>
      <p>
        Footfall provides an AI-powered receptionist for your business&rsquo;s WhatsApp number:
        it answers customer messages, quotes from the price list you configure, books
        appointments into your Footfall calendar, and sends reminders and follow-ups. You remain
        the merchant of record for everything you sell; Footfall is a communication and
        scheduling tool.
      </p>

      <h2 style={S.h2}>Your responsibilities</h2>
      <p>
        You must own or be authorised to use the WhatsApp number you connect, keep your prices,
        services, and hours accurate (the AI answers from what you configure), and use the
        service in compliance with WhatsApp&rsquo;s Business terms — no spam, no prohibited
        content, and messaging only customers who contacted you or consented.
      </p>

      <h2 style={S.h2}>AI-generated replies</h2>
      <p>
        Replies are generated automatically by an AI model from your configured data. While the
        system is designed to only quote prices and slots that exist in your account, you are
        responsible for reviewing your configuration and for the commitments your business makes
        to customers. You can pause the AI per conversation (Inbox) or entirely (Settings) at any
        time.
      </p>

      <h2 style={S.h2}>Fees</h2>
      <p>
        Pricing is as published at getfootfall.com or agreed with you in writing, currently
        including a free trial, a flat monthly plan, and a per-booking plan. Meta&rsquo;s
        WhatsApp conversation fees are included in published plans unless stated otherwise. We
        may change pricing with 30 days&rsquo; notice.
      </p>

      <h2 style={S.h2}>Availability &amp; liability</h2>
      <p>
        We aim for high availability but the service depends on third parties (Meta, hosting and
        AI providers) and is provided &ldquo;as is&rdquo;. To the maximum extent permitted by
        law, our aggregate liability for any claim is limited to the fees you paid us in the
        three months before the claim arose. We are not liable for indirect losses, including
        lost bookings or revenue.
      </p>

      <h2 style={S.h2}>Termination</h2>
      <p>
        You can cancel anytime; paid periods are not refunded pro-rata unless required by law. We
        may suspend accounts that violate these terms or WhatsApp policies. On termination you
        may request export or deletion of your data.
      </p>

      <h2 style={S.h2}>Governing law</h2>
      <p>
        These terms are governed by the laws of India, with courts at Hyderabad, Telangana having
        jurisdiction. Contact: <b>sumithtatipally@gmail.com</b>.
      </p>
    </main>
  );
}
