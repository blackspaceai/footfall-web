import type { MetadataRoute } from "next";
import { VERTICALS } from "@/lib/verticals";

const BASE = "https://getfootfall.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...VERTICALS.map((v) => ({
      url: `${BASE}/for/${v.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
