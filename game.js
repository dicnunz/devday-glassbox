const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const sealCount = document.querySelector("#sealCount");
const resetCount = document.querySelector("#resetCount");
const runTitle = document.querySelector("#runTitle");
const runBrief = document.querySelector("#runBrief");
const aboutDialog = document.querySelector("#aboutDialog");

const W = canvas.width;
const H = canvas.height;
const TILE = 40;
const images = {};
for (const [key, src] of Object.entries({
  board: "assets/generated/glass-lab-board.png",
  avatar: "assets/generated/avatar-cursor.png",
  core: "assets/generated/core-cube.png",
  prism: "assets/generated/prism-node.png",
  hazard: "assets/generated/audit-lens.png",
  gate: "assets/generated/glass-gate.png",
  victory: "assets/generated/glass-lab-victory.png"
})) {
  images[key] = new Image();
  images[key].src = src;
}

const walls = [
  [0, 0, 24, 1], [0, 15, 24, 1], [0, 0, 1, 16], [23, 0, 1, 16],
  [4, 3, 1, 7], [8, 1, 1, 5], [8, 8, 1, 6], [13, 2, 1, 7],
  [17, 1, 1, 5], [17, 8, 1, 7], [3, 11, 7, 1], [12, 11, 8, 1],
  [20, 4, 1, 5], [5, 6, 5, 1], [14, 6, 5, 1]
];

const prisms = [
  { x: 6, y: 2, dir: 1 },
  { x: 11, y: 4, dir: 0 },
  { x: 15, y: 9, dir: 3 },
  { x: 6, y: 13, dir: 2 },
  { x: 21, y: 12, dir: 1 }
];

const seals = [
  { x: 3, y: 2, lit: false },
  { x: 19, y: 2, lit: false },
  { x: 21, y: 7, lit: false },
  { x: 10, y: 13, lit: false },
  { x: 20, y: 13, lit: false }
];

const hazards = [
  { x: 2, y: 8, dx: 1, dy: 0, min: 2, max: 7 },
  { x: 12, y: 8, dx: 0, dy: 1, min: 7, max: 13 },
  { x: 18, y: 10, dx: 1, dy: 0, min: 18, max: 22 }
];

let player;
let resets;
let paused;
let won;
let reducedMotion;
let soundOn;
let lastTick = 0;
let lastHazard = 0;
const keys = new Set();

function resetGame() {
  player = { x: 2, y: 13 };
  resets = 0;
  paused = false;
  won = false;
  seals.forEach((seal) => { seal.lit = false; });
  prisms[0].dir = 1; prisms[1].dir = 0; prisms[2].dir = 3; prisms[3].dir = 2; prisms[4].dir = 1;
  updateUi();
}

function blocked(x, y) {
  if (x < 1 || y < 1 || x > 22 || y > 14) return true;
  return walls.some(([wx, wy, ww, wh]) => x >= wx && x < wx + ww && y >= wy && y < wy + wh);
}

function move(dx, dy) {
  if (paused || won) return;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (!blocked(nx, ny)) {
    player.x = nx;
    player.y = ny;
  }
  checkHazard();
  checkWin();
}

function nearestPrism() {
  return prisms
    .map((p) => ({ p, d: Math.abs(p.x - player.x) + Math.abs(p.y - player.y) }))
    .filter(({ d }) => d <= 2)
    .sort((a, b) => a.d - b.d)[0]?.p;
}

function rotatePrism() {
  if (paused || won) return;
  const prism = nearestPrism();
  if (!prism) return;
  prism.dir = (prism.dir + 1) % 4;
  chirp(660);
  updateUi();
}

function beamPath() {
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let x = 1;
  let y = 5;
  let dir = 0;
  const points = [[x, y]];
  const lit = new Set();
  const seen = new Set();

  for (let i = 0; i < 96; i += 1) {
    const [dx, dy] = dirs[dir];
    x += dx; y += dy;
    if (blocked(x, y)) break;
    points.push([x, y]);
    const key = `${x},${y},${dir}`;
    if (seen.has(key)) break;
    seen.add(key);

    const prism = prisms.find((p) => p.x === x && p.y === y);
    if (prism) dir = (dir + (prism.dir % 2 === 0 ? 1 : 3)) % 4;

    const seal = seals.find((s) => s.x === x && s.y === y);
    if (seal) lit.add(seals.indexOf(seal));
  }

  seals.forEach((seal, index) => { seal.lit = lit.has(index); });
  return points;
}

function checkHazard() {
  if (hazards.some((h) => h.x === player.x && h.y === player.y)) {
    player = { x: 2, y: 13 };
    resets += 1;
    chirp(100);
  }
  updateUi();
}

function checkWin() {
  if (seals.every((seal) => seal.lit) && player.x >= 21 && player.y <= 2) {
    won = true;
    chirp(880);
  }
  updateUi();
}

function updateUi() {
  const lit = seals.filter((seal) => seal.lit).length;
  sealCount.textContent = `${lit} / ${seals.length}`;
  resetCount.textContent = String(resets);
  if (won) {
    runTitle.textContent = "The Core Is Out";
    runBrief.textContent = "Glassbox solved: the trapped core exits through a clean light path. Contest receipt stays in the About panel, not the premise.";
  } else if (lit === seals.length) {
    runTitle.textContent = "Gate Open";
    runBrief.textContent = "All seals are lit. Reach the upper-right containment door without touching an audit lens.";
  } else {
    runTitle.textContent = "Open the Quiet Vault";
    runBrief.textContent = "Rotate nearby prisms so the beam touches every seal. The game is about light, glass, and escape.";
  }
}

function chirp(freq) {
  if (!soundOn) return;
  const audio = new AudioContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = freq;
  gain.gain.value = 0.025;
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.07);
}

function draw() {
  const path = beamPath();
  drawBackdrop();
  drawBoard();
  drawBeam(path);
  drawObjects();
  drawPlayer();
  drawStateOverlay();
  requestAnimationFrame(draw);
}

function drawBackdrop() {
  ctx.clearRect(0, 0, W, H);
  if (images.board.complete) {
    ctx.globalAlpha = 0.23;
    ctx.drawImage(images.board, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(3,7,8,.82)";
  ctx.fillRect(0, 0, W, H);
}

function drawBoard() {
  ctx.strokeStyle = "rgba(190,245,255,.10)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  ctx.fillStyle = "rgba(150,220,230,.13)";
  ctx.strokeStyle = "rgba(160,245,255,.24)";
  for (const [x, y, w, h] of walls) {
    ctx.fillRect(x * TILE, y * TILE, w * TILE, h * TILE);
    ctx.strokeRect(x * TILE, y * TILE, w * TILE, h * TILE);
  }

  ctx.fillStyle = "rgba(255,189,91,.14)";
  ctx.strokeStyle = "#ffbd5b";
  ctx.strokeRect(21 * TILE, TILE, 2 * TILE, 2 * TILE);
  ctx.fillRect(21 * TILE, TILE, 2 * TILE, 2 * TILE);
}

function drawBeam(path) {
  ctx.save();
  ctx.strokeStyle = "#77f5ff";
  ctx.shadowColor = "#77f5ff";
  ctx.shadowBlur = reducedMotion ? 0 : 18;
  ctx.lineWidth = 4;
  ctx.beginPath();
  path.forEach(([x, y], index) => {
    const px = x * TILE + TILE / 2;
    const py = y * TILE + TILE / 2;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();
}

function drawObjects() {
  drawIcon(images.core, 21, 1, 74, seals.every((seal) => seal.lit) ? 0.92 : 0.42);

  for (const seal of seals) {
    ctx.fillStyle = seal.lit ? "#9effff" : "rgba(255,255,255,.22)";
    ctx.strokeStyle = seal.lit ? "#9effff" : "rgba(255,255,255,.38)";
    ctx.beginPath();
    ctx.arc(seal.x * TILE + 20, seal.y * TILE + 20, seal.lit ? 13 : 10, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }

  for (const prism of prisms) {
    drawIcon(images.prism, prism.x, prism.y, 58, 0.82);
    ctx.strokeStyle = "#ffbd5b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const cx = prism.x * TILE + 20;
    const cy = prism.y * TILE + 20;
    const angle = prism.dir * Math.PI / 2;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 22, cy + Math.sin(angle) * 22);
    ctx.stroke();
  }

  for (const h of hazards) drawIcon(images.hazard, h.x, h.y, 54, 0.78);
}

function drawIcon(image, gx, gy, size, alpha) {
  const px = gx * TILE + TILE / 2 - size / 2;
  const py = gy * TILE + TILE / 2 - size / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (image.complete) ctx.drawImage(image, px, py, size, size);
  else {
    ctx.fillStyle = "#72f5ff";
    ctx.fillRect(px, py, size, size);
  }
  ctx.restore();
}

function drawPlayer() {
  const x = player.x * TILE + 20;
  const y = player.y * TILE + 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "#72f5ff";
  ctx.shadowBlur = reducedMotion ? 0 : 14;
  ctx.fillStyle = "#f4fdff";
  ctx.strokeStyle = "#72f5ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -13);
  ctx.lineTo(15, 1);
  ctx.lineTo(3, 5);
  ctx.lineTo(8, 17);
  ctx.lineTo(0, 19);
  ctx.lineTo(-5, 7);
  ctx.lineTo(-13, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawStateOverlay() {
  if (!paused && !won) return;
  ctx.fillStyle = "rgba(3,7,8,.78)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f1fdff";
  ctx.font = "700 36px system-ui";
  ctx.fillText(won ? "THE CORE IS OUT" : "PAUSED", 64, 96);
  ctx.font = "18px system-ui";
  ctx.fillStyle = "#a9c0c4";
  ctx.fillText(won ? "A glass-lab light puzzle. Built with GPT-5.5 in Codex and separate Image Gen assets." : "The beam holds. Resume when ready.", 66, 132);
}

function tick(time) {
  if (!paused && !won && time - lastHazard > 520) {
    for (const h of hazards) {
      if (h.dx) {
        h.x += h.dx;
        if (h.x <= h.min || h.x >= h.max) h.dx *= -1;
      } else {
        h.y += h.dy;
        if (h.y <= h.min || h.y >= h.max) h.dy *= -1;
      }
    }
    checkHazard();
    lastHazard = time;
  }

  if (time - lastTick > 105) {
    if (keys.has("arrowup") || keys.has("w")) move(0, -1);
    if (keys.has("arrowdown") || keys.has("s")) move(0, 1);
    if (keys.has("arrowleft") || keys.has("a")) move(-1, 0);
    if (keys.has("arrowright") || keys.has("d")) move(1, 0);
    lastTick = time;
  }
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
  if (key === " ") {
    event.preventDefault();
    rotatePrism();
  }
  if (key === "r") resetGame();
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

document.querySelector("#touchPad").addEventListener("pointerdown", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "up") move(0, -1);
  if (action === "down") move(0, 1);
  if (action === "left") move(-1, 0);
  if (action === "right") move(1, 0);
  if (action === "rotate") rotatePrism();
});

document.querySelector("#aboutBtn").addEventListener("click", () => aboutDialog.showModal());
document.querySelector("#restartBtn").addEventListener("click", resetGame);
document.querySelector("#pauseBtn").addEventListener("click", (event) => {
  paused = !paused;
  event.currentTarget.setAttribute("aria-pressed", String(paused));
});
document.querySelector("#motionBtn").addEventListener("click", (event) => {
  reducedMotion = !reducedMotion;
  event.currentTarget.setAttribute("aria-pressed", String(reducedMotion));
});
document.querySelector("#soundBtn").addEventListener("click", (event) => {
  soundOn = !soundOn;
  event.currentTarget.textContent = soundOn ? "Sound on" : "Sound off";
  event.currentTarget.setAttribute("aria-pressed", String(soundOn));
});

resetGame();
requestAnimationFrame(draw);
requestAnimationFrame(tick);

window.glassbox = {
  move,
  rotatePrism,
  reset: resetGame,
  winFast() {
    seals.forEach((seal) => { seal.lit = true; });
    player.x = 22;
    player.y = 2;
    checkWin();
  },
  getState: () => ({ player, resets, won, seals: seals.map((s) => s.lit), prisms: prisms.map((p) => p.dir) })
};
