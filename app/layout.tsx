import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Footfall — WhatsApp AI receptionist & booking agent | Never miss another booking",
    template: "%s",
  },
  description:
    "Footfall is a WhatsApp AI that answers every customer message in seconds, books appointments into your calendar, and chases no-shows — for salons, spas, clinics, doctors, dentists, hospitals and gyms in India. 24×7, English + Hindi. ₹1,499/mo, 14 days free.",
  metadataBase: new URL("https://getfootfall.com"),
  alternates: { canonical: "https://getfootfall.com/" },
  keywords: [
    "whatsapp ai",
    "whatsapp booking ai",
    "booking ai",
    "appointment booking ai",
    "ai receptionist",
    "ai receptionist india",
    "whatsapp ai agent",
    "whatsapp chatbot for business",
    "whatsapp automation for business",
    "whatsapp booking bot",
    "salon ai",
    "spa ai",
    "clinic ai",
    "doctor ai",
    "dentist ai",
    "hospital ai",
    "gym ai",
    "salon booking software india",
    "clinic appointment booking whatsapp",
    "doctor appointment whatsapp bot",
    "appointment reminder whatsapp",
    "no show reduction software",
    "ai appointment scheduling",
    "whatsapp business api booking",
  ],
  icons: { icon: "/logo/footfall-app-icon.svg" },
  openGraph: {
    title: "Footfall — WhatsApp AI receptionist & booking agent",
    description:
      "Answers every WhatsApp message in seconds, books the appointment, chases no-shows — for salons, clinics, doctors, spas and gyms. By BlackSpace AI.",
    url: "https://getfootfall.com/",
    siteName: "Footfall",
    type: "website",
    locale: "en_IN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Footfall — never miss another booking" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Footfall — WhatsApp AI receptionist & booking agent",
    description:
      "Your AI receptionist on WhatsApp. Answers in seconds, books the slot, chases no-shows. 14 days free.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
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
