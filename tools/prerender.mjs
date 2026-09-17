import { readFile, writeFile, mkdir } from "node:fs/promises";
import { render } from "../.prerender/entry-server.js";
const root = new URL("../dist/", import.meta.url);
const template = await readFile(new URL("index.html", root), "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
for (const locale of ["zh", "en"])
  for (const page of ["", "privacy", "data-processing"]) {
    const route = `${locale === "en" ? "en/" : ""}${page ? `${page}/` : ""}`;
    const { html, lang, title, description } = render(`/${route}`);
    const output = template
      .replace('lang="zh-CN"', `lang="${lang}"`)
      .replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/>/,
        `<meta name="description" content="${escape(description)}" />`,
      )
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    if (output === template || !output.includes("<h1"))
      throw new Error(`Missing prerendered content: ${route}`);
    await mkdir(new URL(route, root), { recursive: true });
    await writeFile(new URL(`${route}index.html`, root), output);
    console.log(`Prerendered /${route}`);
  }
await writeFile(
  new URL("404.html", root),
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found</title><h1>404</h1><a href="/">DeepSeek Harness</a></html>\n',
);
