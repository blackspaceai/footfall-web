import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start free — get your WhatsApp AI receptionist | Footfall",
  description:
    "Get Footfall for your salon, spa, clinic or gym: an AI receptionist on your WhatsApp number that books appointments 24×7. 14 days free, no card — we set it up for you.",
  alternates: { canonical: "https://getfootfall.com/join" },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
