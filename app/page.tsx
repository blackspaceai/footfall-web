import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

// The marketing page is the exported Footfall design. Its (large) stylesheet
// is served as a cached static file; only the markup is inlined.
export const dynamic = "force-static";

export default function MarketingPage() {
  const dir = path.join(process.cwd(), "marketing");
  const links = fs.readFileSync(path.join(dir, "links.html"), "utf-8");
  const body = fs.readFileSync(path.join(dir, "body.html"), "utf-8");
  return (
    <>
      <link rel="stylesheet" href="/marketing.css" />
      <div dangerouslySetInnerHTML={{ __html: links + body }} />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
