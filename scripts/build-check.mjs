import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const required = [
  "index.html",
  "styles.css",
  "game.js",
  "assets/generated/hero-poster.png",
  "assets/generated/cursor-sprite-sheet.png",
  "assets/generated/level-backdrop.png",
  "assets/generated/victory-social-card.png"
];

for (const file of required) {
  await access(file, constants.R_OK);
}

const html = await readFile("index.html", "utf8");
const js = await readFile("game.js", "utf8");
const css = await readFile("styles.css", "utf8");

if (!html.includes("Unofficial contest entry")) throw new Error("missing unofficial-entry note");
if (/https?:\/\//.test(html + js + css)) throw new Error("unexpected external URL in runtime files");
if (!js.includes("window.glassbox")) throw new Error("missing test hook");

console.log("build-check ok: static runtime files and generated assets present");
