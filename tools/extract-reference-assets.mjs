import { readFile, writeFile, mkdir } from "node:fs/promises";
import { JSDOM } from "jsdom";
const root = new URL("../", import.meta.url);
const document = new JSDOM(
  await readFile(new URL("site/harness/index.html", root), "utf8"),
).window.document;
const brand = document.querySelector('a[href="/harness/"] svg');
brand.setAttribute("xmlns", "http://www.w3.org/2000/svg");
await writeFile(
  new URL("public/images/brand.svg", root),
  brand.outerHTML + "\n",
);
brand.setAttribute("color", "#3157b8");
await writeFile(
  new URL("public/images/brand-light.svg", root),
  brand.outerHTML + "\n",
);
await mkdir(new URL("public/icons/", root), { recursive: true });
const heroLinks = [
  ...document.querySelector("section").querySelectorAll("a"),
].slice(0, 4);
for (const [index, name] of ["github", "docs", "plugins", "paper"].entries()) {
  const svg = heroLinks[index].querySelector("svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  await writeFile(
    new URL(`public/icons/${name}.svg`, root),
    svg.outerHTML + "\n",
  );
}
const pillars = [...document.querySelectorAll("section")][1].querySelectorAll(
  "h3",
);
for (const [index, heading] of [...pillars].entries()) {
  const svg = heading.parentElement.querySelector("svg");
  if (!svg) throw new Error("Missing pillar icon");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  await writeFile(
    new URL(`public/icons/pillar-${index + 1}.svg`, root),
    svg.outerHTML + "\n",
  );
}
function nodeData(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const tag = node.localName;
  const allowed = [
    "p",
    "section",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "span",
    "a",
    "strong",
    "em",
    "code",
    "br",
  ];
  if (!allowed.includes(tag))
    throw new Error(`Unexpected legal content: ${tag}`);
  return {
    tag,
    props: Object.fromEntries(
      [...node.attributes]
        .filter((a) =>
          ["id", "href", "target", "rel", "class"].includes(a.name),
        )
        .map((a) => [a.name === "class" ? "className" : a.name, a.value]),
    ),
    children: [...node.childNodes].map(nodeData).filter((x) => x !== null),
  };
}
const legal = {};
for (const locale of ["zh", "en"])
  for (const page of ["privacy", "data-processing"]) {
    const html = await readFile(
      new URL(
        `site/harness/${locale === "en" ? "en/" : ""}${page}/index.html`,
        root,
      ),
      "utf8",
    );
    const article = new JSDOM(html).window.document.querySelector("article");
    legal[`${locale}/${page}`] = [...article.childNodes]
      .map(nodeData)
      .filter((x) => x !== null);
  }
await writeFile(
  new URL("src/content/legal.json", root),
  JSON.stringify(legal, null, 2) + "\n",
);
const variables = JSON.parse(
  await readFile(new URL("RECON/original-1440.json", root), "utf8"),
).variables;
const css = await readFile(
  new URL("RECON/source/6f322bb0cffe2c36.css", root),
  "utf8",
);
await mkdir(new URL("src/styles/", root), { recursive: true });
const fonts = [...css.matchAll(/@font-face\{[^}]+\}/g)].map((m) => m[0]);
await writeFile(
  new URL("src/styles/tokens.css", root),
  "/* Reference design tokens and self-hosted fonts. See THIRD_PARTY_NOTICES.md. */\n" +
    fonts.join("\n").replaceAll("/harness/fonts/", "/fonts/") +
    "\n:root {\n" +
    Object.entries(variables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n") +
    "\n}\n",
);
console.log("Extracted icons, four legal documents, fonts and design tokens.");
