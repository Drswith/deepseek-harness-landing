import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";

test("production pages and media are served without SPA fallbacks", async (t) => {
  const server = spawn(process.execPath, ["tools/serve.mjs", "--production"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, HOST: "127.0.0.1", PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    if (server.exitCode !== null) return;
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    await stopped;
  });
  const origin = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Static server did not start")),
      10000,
    );
    server.once("error", reject);
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Static server exited: ${code}`));
    });
    server.stdout.on("data", (chunk) => {
      const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
  });
  const resources = new Set();
  for (const locale of ["", "en/"]) {
    for (const page of ["", "privacy/", "data-processing/"]) {
      const response = await fetch(`${origin}/${locale}${page}`);
      assert.equal(response.status, 200);
      const document = new JSDOM(await response.text()).window.document;
      assert.ok(document.querySelector("h1")?.textContent.trim());
      assert.equal(document.querySelector("video"), null);
      assert.equal(document.documentElement.lang, locale ? "en" : "zh-CN");
      assert.ok(document.querySelector('meta[name="description"]')?.content);
      for (const node of document.querySelectorAll(
        "script[src],link[href],img[src]",
      )) {
        const path = node.getAttribute("src") || node.getAttribute("href");
        assert.ok(!path.startsWith("/harness/"), path);
        if (path.startsWith("/")) resources.add(path);
      }
    }
  }
  for (const path of resources) {
    const response = await fetch(`${origin}${path}`, { method: "HEAD" });
    assert.equal(response.status, 200, path);
    assert.doesNotMatch(
      response.headers.get("content-type"),
      /text\/html/,
      path,
    );
  }
  const image = await fetch(`${origin}/images/demo-poster.jpg`, {
    headers: { Range: "bytes=0-1023" },
  });
  assert.equal(image.status, 206);
  assert.equal((await image.arrayBuffer()).byteLength, 1024);
  assert.match(image.headers.get("content-range"), /^bytes 0-1023\/\d+$/);
  assert.equal((await fetch(`${origin}/videos/demo.mp4`)).status, 404);
  const missing = await fetch(`${origin}/missing-page/`);
  assert.equal(missing.status, 404);
  const home = await fetch(`${origin}/`, { redirect: "manual" });
  assert.equal(home.status, 200);
  assert.equal(home.headers.get("location"), null);
  assert.equal((await fetch(`${origin}/harness/`)).status, 404);
  assert.equal((await fetch(`${origin}/`, { method: "POST" })).status, 405);
});
