import { readFile, stat, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
const root = new URL("../dist/", import.meta.url);
for (const locale of ["", "en/"])
  for (const page of ["", "privacy/", "data-processing/"]) {
    const route = `${locale}${page}index.html`;
    const html = await readFile(new URL(route, root), "utf8");
    assert.match(html, /<h1/);
    assert.match(html, /<script[^>]+type="module"/);
    assert.doesNotMatch(html, /self\.__next_f|\/_next\//);
    assert.doesNotMatch(html, /<video\b|\.mp4["?]/);
    assert.doesNotMatch(html, /(?:href|src|poster)="\/harness\//);
    assert.match(html, new RegExp(`lang="${locale ? "en" : "zh-CN"}"`));
  }
for (const file of [
  "images/brand.svg",
  "fonts/dm-sans-400.woff2",
  "images/demo-poster.jpg",
  "index.html",
  "404.html",
])
  assert.ok((await stat(new URL(file, root))).size > 0);
assert.ok(
  !(await readdir(root)).some((name) => ["_next", "harness"].includes(name)),
);
console.log(
  "Production check passed: six prerendered routes, local media, no legacy Next runtime.",
);
