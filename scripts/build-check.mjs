import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const required = [
  "index.html",
  "styles.css",
  "game.js",
  "assets/generated/glass-lab-hero.png",
  "assets/generated/glass-lab-board.png",
  "assets/generated/glass-lab-victory.png",
  "assets/generated/avatar-cursor.png",
  "assets/generated/core-cube.png",
  "assets/generated/prism-node.png",
  "assets/generated/audit-lens.png",
  "assets/generated/glass-gate.png",
  "assets/generated/observatory-card.png"
];

for (const file of required) {
  await access(file, constants.R_OK);
}

const html = await readFile("index.html", "utf8");
const js = await readFile("game.js", "utf8");
const css = await readFile("styles.css", "utf8");

if (!html.includes("Unofficial contest entry")) throw new Error("missing unofficial-entry note");
if (html.includes("research to public ship")) throw new Error("old self-referential theme still present");
const ownPublicUrl = "https://dicnunz.github.io/devday-glassbox/";
const runtimeText = (html + js + css).replaceAll(ownPublicUrl, "");
if (/https?:\/\//.test(runtimeText)) throw new Error("unexpected external URL in runtime files");
if (!js.includes("window.glassbox")) throw new Error("missing test hook");

console.log("build-check ok: static runtime files and generated assets present");
