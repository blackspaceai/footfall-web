import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

// The marketing page is the exported Footfall design (self-contained inline
// styles) with its interactions in /public/app.js — served verbatim.
export default function MarketingPage() {
  const dir = path.join(process.cwd(), "marketing");
  const head = fs.readFileSync(path.join(dir, "head.html"), "utf-8");
  const body = fs.readFileSync(path.join(dir, "body.html"), "utf-8");
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: head + body }} />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
