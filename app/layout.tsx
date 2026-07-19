import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Footfall — AI receptionist on WhatsApp | Never miss another booking",
  description:
    "One AI agent trained on your services, prices and calendar. Answers every WhatsApp inquiry in seconds, books the slot, and chases no-shows — 24x7. ₹1,499/mo or ₹20/booking.",
  metadataBase: new URL("https://getfootfall.com"),
  icons: { icon: "/logo/footfall-app-icon.svg" },
  openGraph: {
    title: "Footfall — Never miss another booking",
    description:
      "Your AI receptionist on WhatsApp. Answers in seconds, books the slot, chases no-shows. By BlackSpace AI.",
    url: "https://getfootfall.com/",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
