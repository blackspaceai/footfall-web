/* Build guard for the hand-edited marketing HTML.

   app/page.tsx injects marketing/links.html + body.html through
   dangerouslySetInnerHTML. A stray or missing closing tag there makes the
   browser close React's wrapper <div> early, so hydration fails on every
   load. Each element must be explicitly closed, in order.

   Usage: node scripts/check-marketing-html.mjs [file ...]
   Defaults to the two files the homepage injects. Exits 1 on any problem. */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_FILES = ["marketing/links.html", "marketing/body.html"];

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "source", "track", "wbr",
]);
// Their contents are raw text, not markup.
const RAW_TEXT = new Set(["script", "style", "textarea", "title"]);
// Inside these, "/>" really does self-close an element (SVG, MathML).
const FOREIGN = new Set(["svg", "math"]);

const TOKEN = /<!--[\s\S]*?-->|<!doctype[^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;

function check(src) {
  const errors = [];
  const stack = []; // { name, index }
  const at = (index) => {
    const before = src.slice(0, index).split("\n");
    return `${before.length}:${before[before.length - 1].length + 1}`;
  };
  const inForeign = () => stack.some((el) => FOREIGN.has(el.name));

  TOKEN.lastIndex = 0;
  let m;
  while ((m = TOKEN.exec(src))) {
    const [raw, slash, tagName, attrs] = m;
    if (!tagName) continue; // comment or doctype
    const name = tagName.toLowerCase();
    const selfClosing = /\/\s*$/.test(attrs);

    if (!slash) {
      if (VOID.has(name)) continue;
      if (selfClosing) {
        if (inForeign()) continue;
        errors.push(`${at(m.index)} <${name}/> does not self-close in HTML; write <${name}></${name}>`);
      }
      stack.push({ name, index: m.index });
      if (RAW_TEXT.has(name)) {
        const end = src.toLowerCase().indexOf(`</${name}`, TOKEN.lastIndex);
        if (end === -1) break; // reported as unclosed below
        TOKEN.lastIndex = end;
      }
      continue;
    }

    if (VOID.has(name)) {
      errors.push(`${at(m.index)} </${name}> is invalid: <${name}> is a void element`);
      continue;
    }
    const top = stack[stack.length - 1];
    if (top && top.name === name) {
      stack.pop();
      continue;
    }
    const open = stack.findLastIndex((el) => el.name === name);
    if (open === -1) {
      errors.push(
        `${at(m.index)} stray </${name}>` +
          (top ? ` (innermost open element is <${top.name}> from ${at(top.index)})` : " (nothing is open)"),
      );
      continue;
    }
    // Recover by closing back to the match, reporting what it skipped.
    for (const el of stack.splice(open + 1).reverse()) {
      errors.push(`${at(el.index)} <${el.name}> is never closed (</${name}> at ${at(m.index)} closes over it)`);
    }
    stack.pop();
  }

  for (const el of stack.reverse()) {
    errors.push(`${at(el.index)} <${el.name}> is never closed`);
  }
  return errors;
}

const files = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_FILES;
let failed = false;
for (const file of files) {
  const errors = check(fs.readFileSync(path.resolve(file), "utf-8"));
  if (!errors.length) continue;
  failed = true;
  console.error(`\n${file}: ${errors.length} unbalanced tag${errors.length === 1 ? "" : "s"}`);
  for (const e of errors.slice(0, 20)) console.error(`  ${file}:${e}`);
  if (errors.length > 20) console.error(`  ... and ${errors.length - 20} more`);
}
if (failed) {
  console.error("\nFix the markup above: the homepage will fail to hydrate otherwise.\n");
  process.exit(1);
}
console.log(`Marketing HTML OK: ${files.join(", ")}`);
