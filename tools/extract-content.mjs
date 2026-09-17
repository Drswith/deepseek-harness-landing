// Reproduce the bilingual copy from the preserved reference, without executing its scripts.
import { readFile, writeFile, mkdir } from "node:fs/promises";
const root = new URL("../", import.meta.url);
await mkdir(new URL("src/content/", root), { recursive: true });
for (const [locale, entry] of [
  ["zh", "site/harness/index.html"],
  ["en", "site/harness/en/index.html"],
]) {
  const html = await readFile(new URL(entry, root), "utf8");
  let messages;
  function inspect(value) {
    if (!value || typeof value !== "object") return;
    if (value.messages?.Index) messages = value.messages;
    for (const child of Object.values(value)) inspect(child);
  }
  for (const match of html.matchAll(
    /self\.__next_f\.push\((\[.*?\])\)<\/script>/gs,
  )) {
    const frame = JSON.parse(match[1]);
    if (typeof frame[1] !== "string") continue;
    for (const line of frame[1].split("\n")) {
      const payload = line.slice(line.indexOf(":") + 1);
      if (!payload.startsWith("[") && !payload.startsWith("{")) continue;
      try {
        inspect(JSON.parse(payload));
      } catch {
        /* Not every Flight record is plain JSON. */
      }
    }
  }
  if (!messages?.Index) throw new Error(`Missing copy in ${entry}`);
  await writeFile(
    new URL(`src/content/${locale}.json`, root),
    JSON.stringify(messages, null, 2) + "\n",
  );
  console.log(
    locale,
    Object.fromEntries(
      Object.entries(messages).map(([key, value]) => [
        key,
        Object.keys(value).length,
      ]),
    ),
  );
}
