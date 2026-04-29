const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const roomStatus = document.querySelector("#roomStatus");
const objectiveStatus = document.querySelector("#objectiveStatus");
const receiptStatus = document.querySelector("#receiptStatus");
const aboutDialog = document.querySelector("#aboutDialog");

const TILE = 32;
const cols = canvas.width / TILE;
const rows = canvas.height / TILE;
const rooms = [
  { name: "Verify", item: "source seal", hazard: "unverified claim", color: "#75f4ff", rect: [2, 2, 9, 7] },
  { name: "Generate", item: "Image Gen shard", hazard: "asset shortcut", color: "#c58cff", rect: [17, 2, 10, 7] },
  { name: "Build", item: "code bridge", hazard: "paid API", color: "#e8faff", rect: [10, 8, 10, 6] },
  { name: "Deploy", item: "free host portal", hazard: "credit card", color: "#78ffbc", rect: [2, 12, 9, 6] },
  { name: "Submit", item: "approval gate", hazard: "new browser window", color: "#ffbd5b", rect: [19, 12, 9, 6] }
];

const images = {};
for (const [key, src] of Object.entries({
  backdrop: "assets/generated/level-backdrop.png",
  sprite: "assets/generated/cursor-sprite-sheet.png",
  victory: "assets/generated/victory-social-card.png"
})) {
  images[key] = new Image();
  images[key].src = src;
}

let state;
let paused = false;
let reducedMotion = false;
let soundOn = false;
let lastMove = 0;
const keys = new Set();

function reset() {
  state = {
    x: 4,
    y: 5,
    step: 0,
    won: false,
    deaths: 0,
    collected: rooms.map(() => false),
    items: rooms.map((room, index) => {
      const [x, y, w, h] = room.rect;
      return { index, x: x + Math.floor(w / 2), y: y + Math.floor(h / 2) };
    }),
    hazards: [
      { x: 8, y: 4, type: "claim" },
      { x: 23, y: 4, type: "shortcut" },
      { x: 14, y: 11, type: "paid api" },
      { x: 7, y: 15, type: "card" },
      { x: 24, y: 15, type: "window" },
      { x: 16, y: 13, type: "tracking" }
    ],
    gates: [
      [10, 5], [16, 5], [15, 8], [10, 14], [20, 14]
    ]
  };
  paused = false;
  updateCopy();
}

function inRoom(x, y, room) {
  const [rx, ry, w, h] = room.rect;
  return x >= rx && x < rx + w && y >= ry && y < ry + h;
}

function isWalkable(x, y) {
  if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) return false;
  if (rooms.some((room) => inRoom(x, y, room))) return true;
  const bridges = [
    [11, 5], [12, 5], [13, 5], [14, 5], [15, 5],
    [15, 6], [15, 7], [15, 8], [15, 9], [15, 10], [15, 11],
    [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14], [17, 14], [18, 14], [19, 14],
    [15, 12], [15, 13]
  ];
  return bridges.some(([bx, by]) => bx === x && by === y);
}

function move(dx, dy) {
  if (paused || state.won) return;
  const nx = state.x + dx;
  const ny = state.y + dy;
  if (!isWalkable(nx, ny)) return;
  state.x = nx;
  state.y = ny;
  resolveTile();
}

function resolveTile() {
  const hazard = state.hazards.find((h) => h.x === state.x && h.y === state.y);
  if (hazard) {
    state.deaths += 1;
    state.x = Math.max(2, rooms[state.step].rect[0] + 1);
    state.y = rooms[state.step].rect[1] + 1;
    chirp(90);
  }

  const item = state.items.find((i) => i.x === state.x && i.y === state.y && i.index === state.step);
  if (item && !state.collected[item.index]) {
    state.collected[item.index] = true;
    chirp(520);
  }

  const current = rooms[state.step];
  const atExit = !inRoom(state.x, state.y, current);
  if (state.collected[state.step] && atExit && state.step < rooms.length - 1) {
    state.step += 1;
    chirp(720);
  }

  if (state.step === rooms.length - 1 && state.collected[4] && state.x === 23 && state.y === 17) {
    state.won = true;
    chirp(920);
  }
  updateCopy();
}

function updateCopy() {
  const room = rooms[state.step];
  roomStatus.textContent = state.won ? "Submission ready" : `Room ${state.step + 1}/5: ${room.name}`;
  objectiveStatus.textContent = state.won
    ? "Win: #OpenAIDevDay2026 | Built with GPT-5.5 in Codex + Image Gen assets, $0 spend."
    : `Collect ${room.item}. Avoid ${room.hazard}.`;
  receiptStatus.textContent = `Receipt: $0 spend, ${state.deaths} rule resets, no tracking.`;
}

function chirp(freq) {
  if (!soundOn) return;
  const audio = new AudioContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = freq;
  gain.gain.value = 0.035;
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.08);
}

function drawRoom(room, index) {
  const [x, y, w, h] = room.rect;
  ctx.save();
  ctx.strokeStyle = state.step === index ? room.color : "rgba(200,245,255,.23)";
  ctx.lineWidth = state.step === index ? 3 : 1;
  ctx.fillStyle = state.step === index ? "rgba(110,239,255,.08)" : "rgba(255,255,255,.025)";
  ctx.fillRect(x * TILE, y * TILE, w * TILE, h * TILE);
  ctx.strokeRect(x * TILE, y * TILE, w * TILE, h * TILE);
  ctx.fillStyle = room.color;
  ctx.font = "700 13px system-ui";
  ctx.fillText(room.name.toUpperCase(), x * TILE + 12, y * TILE + 22);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (images.backdrop.complete) {
    ctx.globalAlpha = 0.44;
    ctx.drawImage(images.backdrop, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(3,7,9,.58)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  rooms.forEach(drawRoom);
  drawBridges();
  drawHazards();
  drawItems();
  drawPlayer();
  drawOverlay();
  requestAnimationFrame(draw);
}

function drawGrid() {
  ctx.strokeStyle = "rgba(201,247,255,.09)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= cols; x += 1) {
    ctx.beginPath(); ctx.moveTo(x * TILE, 0); ctx.lineTo(x * TILE, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= rows; y += 1) {
    ctx.beginPath(); ctx.moveTo(0, y * TILE); ctx.lineTo(canvas.width, y * TILE); ctx.stroke();
  }
}

function drawBridges() {
  ctx.fillStyle = "rgba(110,239,255,.22)";
  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      if (isWalkable(x, y) && !rooms.some((r) => inRoom(x, y, r))) {
        ctx.fillRect(x * TILE + 9, y * TILE + 9, 14, 14);
      }
    }
  }
}

function drawHazards() {
  for (const h of state.hazards) {
    ctx.fillStyle = "rgba(255,101,95,.22)";
    ctx.strokeStyle = "#ff655f";
    ctx.fillRect(h.x * TILE + 4, h.y * TILE + 4, 24, 24);
    ctx.strokeRect(h.x * TILE + 4, h.y * TILE + 4, 24, 24);
    ctx.fillStyle = "#ffd0cc";
    ctx.font = "18px system-ui";
    ctx.fillText("!", h.x * TILE + 13, h.y * TILE + 24);
  }
}

function drawItems() {
  for (const item of state.items) {
    if (state.collected[item.index]) continue;
    const room = rooms[item.index];
    ctx.fillStyle = room.color;
    ctx.shadowColor = room.color;
    ctx.shadowBlur = reducedMotion ? 0 : 16;
    ctx.beginPath();
    ctx.arc(item.x * TILE + 16, item.y * TILE + 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = "#ffbd5b";
  ctx.fillRect(23 * TILE + 6, 17 * TILE + 6, 20, 20);
}

function drawPlayer() {
  const x = state.x * TILE + 16;
  const y = state.y * TILE + 16;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f5feff";
  ctx.strokeStyle = "#69eeff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-9, -12);
  ctx.lineTo(14, 0);
  ctx.lineTo(2, 4);
  ctx.lineTo(8, 16);
  ctx.lineTo(1, 18);
  ctx.lineTo(-5, 6);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawOverlay() {
  if (paused || state.won) {
    ctx.fillStyle = "rgba(3,7,9,.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#effcff";
    ctx.font = "700 34px system-ui";
    ctx.fillText(state.won ? "PUBLIC SUBMISSION PATH CLEARED" : "PAUSED", 74, 104);
    ctx.font = "18px system-ui";
    const line = state.won
      ? "#OpenAIDevDay2026 | Built with GPT-5.5 in Codex + Image Gen assets | $0 spend"
      : "Resume when ready. The glass remembers every constraint.";
    ctx.fillText(line, 76, 142);
    if (state.won) {
      ctx.fillText("Playable link: public URL appears in the contest reply after deployment.", 76, 174);
      ctx.fillText("Unofficial contest entry. No backend, tracking, accounts, or paid APIs.", 76, 206);
    }
  }
}

function tick(time) {
  if (time - lastMove > 96) {
    if (keys.has("ArrowUp") || keys.has("w")) move(0, -1);
    if (keys.has("ArrowDown") || keys.has("s")) move(0, 1);
    if (keys.has("ArrowLeft") || keys.has("a")) move(-1, 0);
    if (keys.has("ArrowRight") || keys.has("d")) move(1, 0);
    lastMove = time;
  }
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
  if (key === "r") reset();
  if (key === " ") paused = !paused;
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

document.querySelector("#touchPad").addEventListener("pointerdown", (event) => {
  const button = event.target.closest("button[data-dir]");
  if (!button) return;
  const dir = button.dataset.dir;
  if (dir === "up") move(0, -1);
  if (dir === "down") move(0, 1);
  if (dir === "left") move(-1, 0);
  if (dir === "right") move(1, 0);
});

document.querySelector("#aboutBtn").addEventListener("click", () => aboutDialog.showModal());
document.querySelector("#restartBtn").addEventListener("click", reset);
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

reset();
requestAnimationFrame(draw);
requestAnimationFrame(tick);

window.glassbox = {
  move,
  reset,
  winFast() {
    for (let i = 0; i < rooms.length; i += 1) state.collected[i] = true;
    state.step = 4;
    state.x = 23;
    state.y = 17;
    resolveTile();
  },
  getState: () => ({ ...state })
};
