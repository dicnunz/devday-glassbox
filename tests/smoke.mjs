import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = resolve(".");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png" };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const data = await readFile(join(root, path));
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolveListen) => server.listen(4173, "127.0.0.1", resolveListen));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.keyboard.press("ArrowRight");
await page.keyboard.press("KeyD");
await page.locator("#aboutBtn").click();
await page.locator("dialog button").click();
await page.locator('[data-dir="right"]').click();
await page.evaluate(() => window.glassbox.winFast());
await page.screenshot({ path: "devday-glassbox-proof/screenshots/local-game-win.png", fullPage: true });
const text = await page.locator("#objectiveStatus").textContent();
if (!text.includes("#OpenAIDevDay2026")) throw new Error("win state missing hashtag receipt");
if (errors.length) throw new Error(`console/page errors: ${errors.join(" | ")}`);
await browser.close();
server.close();
console.log("smoke ok: load, keyboard, touch, about modal, win path, screenshot");
