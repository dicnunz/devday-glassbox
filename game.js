const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const sealCount = document.querySelector("#sealCount");
const levelCount = document.querySelector("#levelCount");
const resetCount = document.querySelector("#resetCount");
const runTitle = document.querySelector("#runTitle");
const runBrief = document.querySelector("#runBrief");
const aboutDialog = document.querySelector("#aboutDialog");

const W = canvas.width;
const H = canvas.height;
const CELL = 48;
const GRID_W = 16;
const GRID_H = 10;
const OX = Math.round((W - GRID_W * CELL) / 2);
const OY = 74;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const ARROWS = [">", "v", "<", "^"];
const COLORS = {
  base: "#82f8ff",
  amber: "#ffbd5b",
  violet: "#c89cff",
  red: "#ff5e62",
  wall: "rgba(165,230,240,.16)",
  panel: "rgba(4,10,12,.82)"
};

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

const levels = [
  {
    title: "I. First Reflection",
    brief: "One mirror is enough to wake the beam. Rotate it until the core hears the light.",
    start: [2, 8],
    emitter: { x: 1, y: 5, dir: 0 },
    cores: [{ x: 10, y: 2 }],
    walls: [[0, 0, 16, 1], [0, 9, 16, 1], [0, 0, 1, 10], [15, 0, 1, 10], [4, 2, 1, 2], [8, 7, 4, 1]],
    devices: [{ id: "m1", type: "mirror", x: 10, y: 5, dir: 3 }],
    solution: { m1: 0 }
  },
  {
    title: "II. Split Discipline",
    brief: "A prism makes one beam become two. Both receivers must stay lit at once.",
    start: [2, 7],
    emitter: { x: 1, y: 5, dir: 0 },
    cores: [{ x: 7, y: 2 }, { x: 7, y: 8 }],
    walls: [[0, 0, 16, 1], [0, 9, 16, 1], [0, 0, 1, 10], [15, 0, 1, 10], [3, 2, 1, 2], [11, 6, 1, 3]],
    devices: [{ id: "p1", type: "prism", x: 7, y: 5, dir: 0 }],
    solution: { p1: 0 }
  },
  {
    title: "III. Shutter Etiquette",
    brief: "The beam is correct, but the room is not ready. Toggle the shutter before solving the angle.",
    start: [4, 7],
    emitter: { x: 1, y: 6, dir: 0 },
    cores: [{ x: 13, y: 2 }],
    walls: [[0, 0, 16, 1], [0, 9, 16, 1], [0, 0, 1, 10], [15, 0, 1, 10], [5, 2, 1, 3], [9, 1, 1, 4]],
    devices: [
      { id: "s1", type: "shutter", x: 6, y: 6, open: false },
      { id: "m1", type: "mirror", x: 13, y: 6, dir: 3 }
    ],
    solution: { s1: true, m1: 0 }
  },
  {
    title: "IV. The Lens Needs Silence",
    brief: "Some glass will only answer focused light. Pass through the lens before touching the core.",
    start: [3, 3],
    emitter: { x: 1, y: 4, dir: 0 },
    cores: [{ x: 12, y: 7, focus: true }],
    walls: [[0, 0, 16, 1], [0, 9, 16, 1], [0, 0, 1, 10], [15, 0, 1, 10], [7, 1, 1, 2], [10, 6, 1, 3]],
    devices: [
      { id: "l1", type: "lens", x: 5, y: 4, dir: 0 },
      { id: "m1", type: "mirror", x: 12, y: 4, dir: 3 }
    ],
    solution: { l1: 0, m1: 1 }
  },
  {
    title: "V. Gate With A Memory",
    brief: "Light the sensor to open the gate. Then walk through before the lab forgets.",
    start: [2, 7],
    emitter: { x: 1, y: 2, dir: 0 },
    cores: [{ x: 12, y: 7 }],
    sensors: [{ x: 8, y: 2, gate: "g1" }],
    gates: [{ id: "g1", x: 8, y: 7, open: false }],
    walls: [[0, 0, 16, 1], [0, 9, 16, 1], [0, 0, 1, 10], [15, 0, 1, 10], [5, 4, 1, 3], [10, 4, 1, 4]],
    devices: [
      { id: "m1", type: "mirror", x: 12, y: 2, dir: 1 },
      { id: "m2", type: "mirror", x: 12, y: 7, dir: 0 }
    ],
    solution: { m1: 1, m2: 0 }
  },
  {
    title: "VI. Moving Audit",
    brief: "The optics are simple. The room is not. Cross between the red lenses.",
    start: [2, 8],
    emitter: { x: 1, y: 5, dir: 0 },
    cores: [{ x: 13, y: 2 }],
    walls: [[0, 0, 16, 1], [0, 9, 16, 1], [0, 0, 1, 10], [15, 0, 1, 10], [4, 1, 1, 3], [9, 6, 1, 3]],
    hazards: [{ x: 6, y: 7, axis: "x", min: 5, max: 8, step: 1 }, { x: 12, y: 4, axis: "y", min: 3, max: 7, step: 1 }],
    devices: [
      { id: "m1", type: "mirror", x: 13, y: 5, dir: 3 }
    ],
    solution: { m1: 0 }
  },
  {
    title: "VII. The One-Prompt Escape",
    brief: "Final chamber. Split the beam, focus it, open the gate, and leave with the core awake.",
    start: [2, 8],
    emitter: { x: 1, y: 5, dir: 0 },
    cores: [{ x: 6, y: 1, focus: true }, { x: 6, y: 8 }],
    sensors: [{ x: 10, y: 5, gate: "g1" }],
    gates: [{ id: "g1", x: 10, y: 8, open: false }],
    walls: [[0, 0, 16, 1], [0, 9, 16, 1], [0, 0, 1, 10], [15, 0, 1, 10], [4, 1, 1, 3], [4, 7, 1, 2], [11, 1, 1, 3], [11, 7, 1, 2]],
    hazards: [{ x: 6, y: 6, axis: "x", min: 5, max: 9, step: 1 }],
    devices: [
      { id: "p1", type: "prism", x: 6, y: 5, dir: 0 },
      { id: "l1", type: "lens", x: 6, y: 2, dir: 0 },
      { id: "m1", type: "mirror", x: 13, y: 5, dir: 3 },
      { id: "s1", type: "shutter", x: 8, y: 5, open: true }
    ],
    solution: { p1: 0, l1: 0, m1: 3, s1: true }
  }
];

let levelIndex = 0;
let level;
let player;
let devices;
let hazards;
let gates;
let resets = 0;
let won = false;
let paused = false;
let campaignComplete = false;
let reducedMotion = false;
let soundOn = false;
let lastMove = 0;
let lastHazard = 0;
let solvedAt = 0;
let beams = [];
const keys = new Set();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLevel(index) {
  levelIndex = index;
  level = clone(levels[levelIndex]);
  devices = level.devices || [];
  hazards = level.hazards || [];
  gates = level.gates || [];
  player = { x: level.start[0], y: level.start[1] };
  won = false;
  paused = false;
  campaignComplete = false;
  solvedAt = 0;
  calculateBeams();
  updateUi();
}

function resetCurrent() {
  resets += 1;
  loadLevel(levelIndex);
}

function wallAt(x, y) {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return true;
  return (level.walls || []).some(([wx, wy, ww, wh]) => x >= wx && x < wx + ww && y >= wy && y < wy + wh);
}

function gateAt(x, y) {
  return gates.find((gate) => gate.x === x && gate.y === y);
}

function shutterAt(x, y) {
  return devices.find((device) => device.type === "shutter" && device.x === x && device.y === y);
}

function blocked(x, y) {
  if (wallAt(x, y)) return true;
  const gate = gateAt(x, y);
  if (gate && !gate.open) return true;
  return false;
}

function deviceAt(x, y) {
  return devices.find((device) => device.x === x && device.y === y);
}

function nearestDevice() {
  return devices
    .map((device) => ({ device, d: Math.abs(device.x - player.x) + Math.abs(device.y - player.y) }))
    .filter(({ d }) => d <= 2)
    .sort((a, b) => a.d - b.d)[0]?.device;
}

function interact() {
  if (paused || campaignComplete) return;
  const device = nearestDevice();
  if (!device) return;
  if (device.type === "shutter") {
    device.open = !device.open;
    chirp(device.open ? 520 : 180);
  } else {
    device.dir = (device.dir + 1) % 4;
    chirp(640);
  }
  calculateBeams();
  updateUi();
}

function move(dx, dy) {
  if (paused || campaignComplete) return;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (!blocked(nx, ny)) {
    player.x = nx;
    player.y = ny;
  }
  checkHazardContact();
  checkExit();
}

function rayColor(ray) {
  if (ray.focus) return "#ffffff";
  return ray.color || COLORS.base;
}

function reflect(dir, mirrorDir) {
  const slash = mirrorDir % 2 === 0;
  if (slash) return [3, 2, 1, 0][dir];
  return [1, 0, 3, 2][dir];
}

function calculateBeams() {
  const rays = [{ x: level.emitter.x, y: level.emitter.y, dir: level.emitter.dir, focus: false, color: COLORS.base, trail: [[level.emitter.x, level.emitter.y]] }];
  const litCores = new Set();
  const litSensors = new Set();
  const finished = [];
  const seen = new Set();

  gates.forEach((gate) => { gate.open = false; });

  for (let r = 0; r < rays.length && r < 32; r += 1) {
    const ray = rays[r];
    for (let i = 0; i < 80; i += 1) {
      const [dx, dy] = DIRS[ray.dir];
      ray.x += dx;
      ray.y += dy;
      ray.trail.push([ray.x, ray.y]);

      if (wallAt(ray.x, ray.y)) break;
      const gate = gateAt(ray.x, ray.y);
      if (gate && !gate.open) break;
      const shutter = shutterAt(ray.x, ray.y);
      if (shutter && !shutter.open) break;

      const key = `${ray.x},${ray.y},${ray.dir},${ray.focus},${ray.color}`;
      if (seen.has(key)) break;
      seen.add(key);

      const coreIndex = (level.cores || []).findIndex((core) => core.x === ray.x && core.y === ray.y && (!core.focus || ray.focus));
      if (coreIndex !== -1) litCores.add(coreIndex);

      const sensorIndex = (level.sensors || []).findIndex((sensor) => sensor.x === ray.x && sensor.y === ray.y);
      if (sensorIndex !== -1) {
        litSensors.add(sensorIndex);
        const sensor = level.sensors[sensorIndex];
        const sensorGate = gates.find((candidate) => candidate.id === sensor.gate);
        if (sensorGate) sensorGate.open = true;
      }

      const device = deviceAt(ray.x, ray.y);
      if (!device) continue;
      if (device.type === "mirror") {
        ray.dir = reflect(ray.dir, device.dir);
      } else if (device.type === "prism") {
        const left = { ...ray, dir: (ray.dir + 3) % 4, trail: [[ray.x, ray.y]], color: COLORS.violet };
        const right = { ...ray, dir: (ray.dir + 1) % 4, trail: [[ray.x, ray.y]], color: COLORS.amber };
        rays.push(left, right);
      } else if (device.type === "lens") {
        ray.focus = true;
        ray.color = "#ffffff";
      }
    }
    finished.push(ray);
  }

  beams = finished;
  level.litCores = litCores;
  level.litSensors = litSensors;
  if (litCores.size === (level.cores || []).length && !solvedAt) solvedAt = performance.now();
}

function checkHazardContact() {
  if (hazards.some((hazard) => hazard.x === player.x && hazard.y === player.y)) {
    player = { x: level.start[0], y: level.start[1] };
    resets += 1;
    chirp(100);
  }
  updateUi();
}

function checkExit() {
  if (level.litCores?.size !== (level.cores || []).length) return;
  const exitCore = level.cores[level.cores.length - 1];
  if (Math.abs(player.x - exitCore.x) + Math.abs(player.y - exitCore.y) > 2) return;
  won = true;
  chirp(880);
  if (levelIndex === levels.length - 1) {
    campaignComplete = true;
  } else {
    setTimeout(() => loadLevel(levelIndex + 1), reducedMotion ? 80 : 850);
  }
  updateUi();
}

function updateUi() {
  const lit = level.litCores?.size || 0;
  sealCount.textContent = `${lit} / ${(level.cores || []).length}`;
  levelCount.textContent = `${levelIndex + 1} / ${levels.length}`;
  resetCount.textContent = String(resets);
  runTitle.textContent = campaignComplete ? "The Lab Opens" : level.title;
  runBrief.textContent = campaignComplete
    ? "Seven rooms solved. The core leaves the vault with no hidden server, tracker, or paid runtime behind it."
    : level.brief;
}

function chirp(freq) {
  if (!soundOn) return;
  const audio = new AudioContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = freq;
  gain.gain.value = 0.026;
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.08);
}

function sx(x) { return OX + x * CELL; }
function sy(y) { return OY + y * CELL; }
function cx(x) { return sx(x) + CELL / 2; }
function cy(y) { return sy(y) + CELL / 2; }

function draw() {
  calculateBeams();
  drawBackdrop();
  drawGrid();
  drawGlass();
  drawBeams();
  drawMechanisms();
  drawActors();
  drawHud();
  requestAnimationFrame(draw);
}

function drawBackdrop() {
  ctx.clearRect(0, 0, W, H);
  if (images.board.complete) {
    ctx.globalAlpha = 0.18;
    ctx.drawImage(images.board, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(3,7,8,.86)";
  ctx.fillRect(0, 0, W, H);
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = "rgba(195,245,255,.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_W; x += 1) {
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(0));
    ctx.lineTo(sx(x), sy(GRID_H));
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_H; y += 1) {
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(y));
    ctx.lineTo(sx(GRID_W), sy(y));
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(130,248,255,.38)";
  ctx.lineWidth = 2;
  ctx.strokeRect(sx(0), sy(0), GRID_W * CELL, GRID_H * CELL);
  ctx.restore();
}

function drawGlass() {
  ctx.save();
  for (const [x, y, w, h] of level.walls || []) {
    const px = sx(x);
    const py = sy(y);
    ctx.fillStyle = COLORS.wall;
    ctx.strokeStyle = "rgba(170,245,255,.26)";
    ctx.fillRect(px, py, w * CELL, h * CELL);
    ctx.strokeRect(px + 0.5, py + 0.5, w * CELL - 1, h * CELL - 1);
  }

  for (const gate of gates) {
    ctx.save();
    ctx.globalAlpha = gate.open ? 0.26 : 0.82;
    if (images.gate.complete) ctx.drawImage(images.gate, sx(gate.x) - 7, sy(gate.y) - 7, CELL + 14, CELL + 14);
    ctx.strokeStyle = gate.open ? COLORS.base : COLORS.amber;
    ctx.strokeRect(sx(gate.x) + 6, sy(gate.y) + 6, CELL - 12, CELL - 12);
    ctx.restore();
  }
  ctx.restore();
}

function drawBeams() {
  for (const ray of beams) {
    if (ray.trail.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = rayColor(ray);
    ctx.shadowColor = rayColor(ray);
    ctx.shadowBlur = reducedMotion ? 0 : (ray.focus ? 24 : 14);
    ctx.lineWidth = ray.focus ? 5 : 3;
    ctx.beginPath();
    ray.trail.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(cx(x), cy(y));
      else ctx.lineTo(cx(x), cy(y));
    });
    ctx.stroke();
    ctx.restore();
  }
}

function drawMechanisms() {
  drawEmitter();
  for (const sensor of level.sensors || []) drawSensor(sensor);
  for (const core of level.cores || []) drawCore(core);
  for (const device of devices) drawDevice(device);
  for (const hazard of hazards) drawHazard(hazard);
}

function drawEmitter() {
  const { x, y, dir } = level.emitter;
  ctx.save();
  ctx.fillStyle = "rgba(130,248,255,.18)";
  ctx.strokeStyle = COLORS.base;
  ctx.translate(cx(x), cy(y));
  ctx.rotate(dir * Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(-15, -15);
  ctx.lineTo(18, 0);
  ctx.lineTo(-15, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCore(core) {
  const lit = level.litCores?.has(level.cores.indexOf(core));
  ctx.save();
  ctx.globalAlpha = lit ? 0.96 : 0.48;
  if (images.core.complete) ctx.drawImage(images.core, sx(core.x) - 10, sy(core.y) - 10, CELL + 20, CELL + 20);
  ctx.strokeStyle = core.focus ? "#ffffff" : COLORS.base;
  ctx.shadowColor = lit ? ctx.strokeStyle : "transparent";
  ctx.shadowBlur = reducedMotion ? 0 : 18;
  ctx.strokeRect(sx(core.x) + 5, sy(core.y) + 5, CELL - 10, CELL - 10);
  ctx.restore();
}

function drawSensor(sensor) {
  const lit = level.litSensors?.has(level.sensors.indexOf(sensor));
  ctx.save();
  ctx.fillStyle = lit ? COLORS.amber : "rgba(255,189,91,.18)";
  ctx.strokeStyle = COLORS.amber;
  ctx.beginPath();
  ctx.arc(cx(sensor.x), cy(sensor.y), lit ? 13 : 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawDevice(device) {
  ctx.save();
  const near = nearestDevice() === device;
  if (device.type === "mirror") {
    ctx.translate(cx(device.x), cy(device.y));
    ctx.rotate(device.dir * Math.PI / 2);
    ctx.strokeStyle = near ? "#ffffff" : COLORS.base;
    ctx.lineWidth = near ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(-15, 15);
    ctx.lineTo(15, -15);
    ctx.stroke();
  } else if (device.type === "prism") {
    if (images.prism.complete) ctx.drawImage(images.prism, sx(device.x) - 9, sy(device.y) - 9, CELL + 18, CELL + 18);
    ctx.translate(cx(device.x), cy(device.y));
    ctx.rotate(device.dir * Math.PI / 2);
    ctx.strokeStyle = near ? "#ffffff" : COLORS.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(16, 14);
    ctx.lineTo(-16, 14);
    ctx.closePath();
    ctx.stroke();
  } else if (device.type === "lens") {
    ctx.translate(cx(device.x), cy(device.y));
    ctx.rotate(device.dir * Math.PI / 2);
    ctx.strokeStyle = near ? "#ffffff" : "#dffcff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 19, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (device.type === "shutter") {
    ctx.fillStyle = device.open ? "rgba(130,248,255,.14)" : "rgba(255,189,91,.20)";
    ctx.strokeStyle = near ? "#ffffff" : (device.open ? COLORS.base : COLORS.amber);
    ctx.fillRect(sx(device.x) + 6, sy(device.y) + 6, CELL - 12, CELL - 12);
    ctx.strokeRect(sx(device.x) + 6, sy(device.y) + 6, CELL - 12, CELL - 12);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = "700 12px system-ui";
    ctx.fillText(device.open ? "OPEN" : "SHUT", sx(device.x) + 8, sy(device.y) + 28);
  }
  ctx.restore();
}

function drawHazard(hazard) {
  ctx.save();
  if (images.hazard.complete) ctx.drawImage(images.hazard, sx(hazard.x) - 8, sy(hazard.y) - 8, CELL + 16, CELL + 16);
  ctx.strokeStyle = COLORS.red;
  ctx.shadowColor = COLORS.red;
  ctx.shadowBlur = reducedMotion ? 0 : 12;
  ctx.beginPath();
  ctx.arc(cx(hazard.x), cy(hazard.y), 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawActors() {
  if (images.avatar.complete) {
    ctx.drawImage(images.avatar, sx(player.x) - 8, sy(player.y) - 8, CELL + 16, CELL + 16);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sx(player.x) + 14, sy(player.y) + 14, 20, 20);
  }
}

function drawHud() {
  ctx.save();
  ctx.fillStyle = "rgba(2,6,7,.72)";
  ctx.fillRect(OX, 18, GRID_W * CELL, 38);
  ctx.strokeStyle = "rgba(130,248,255,.24)";
  ctx.strokeRect(OX, 18, GRID_W * CELL, 38);
  ctx.fillStyle = COLORS.amber;
  ctx.font = "700 13px system-ui";
  ctx.fillText(level.title.toUpperCase(), OX + 14, 42);
  ctx.fillStyle = "#bcd2d6";
  ctx.fillText(`Interact: ${nearestDevice() ? "ready" : "move near a mechanism"}    ${ARROWS[level.emitter.dir]} emitter`, OX + 280, 42);
  if (campaignComplete || won) drawWinOverlay();
  ctx.restore();
}

function drawWinOverlay() {
  ctx.save();
  ctx.fillStyle = campaignComplete ? "rgba(2,6,7,.82)" : "rgba(2,6,7,.56)";
  ctx.fillRect(OX, OY, GRID_W * CELL, GRID_H * CELL);
  if (campaignComplete && images.victory.complete) {
    ctx.globalAlpha = 0.3;
    ctx.drawImage(images.victory, OX, OY, GRID_W * CELL, GRID_H * CELL);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#f1fdff";
  ctx.font = "700 36px system-ui";
  ctx.fillText(campaignComplete ? "THE GLASSBOX OPENS" : "CHAMBER CLEAR", OX + 56, OY + 92);
  ctx.font = "18px system-ui";
  ctx.fillStyle = "#b9d1d5";
  ctx.fillText(campaignComplete ? "Seven handcrafted chambers solved. The core leaves cleanly." : "Hold still. The next chamber is sliding into place.", OX + 58, OY + 128);
  ctx.restore();
}

function stepHazards(time) {
  if (paused || campaignComplete || time - lastHazard < 560) return;
  for (const hazard of hazards) {
    if (hazard.axis === "x") {
      hazard.x += hazard.step;
      if (hazard.x <= hazard.min || hazard.x >= hazard.max) hazard.step *= -1;
    } else {
      hazard.y += hazard.step;
      if (hazard.y <= hazard.min || hazard.y >= hazard.max) hazard.step *= -1;
    }
  }
  checkHazardContact();
  lastHazard = time;
}

function tick(time) {
  stepHazards(time);
  if (!paused && !campaignComplete && time - lastMove > 115) {
    if (keys.has("arrowup") || keys.has("w")) move(0, -1);
    if (keys.has("arrowdown") || keys.has("s")) move(0, 1);
    if (keys.has("arrowleft") || keys.has("a")) move(-1, 0);
    if (keys.has("arrowright") || keys.has("d")) move(1, 0);
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
  if (key === " ") {
    event.preventDefault();
    interact();
  }
  if (key === "r") resetCurrent();
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
  if (action === "rotate") interact();
});

document.querySelector("#aboutBtn").addEventListener("click", () => aboutDialog.showModal());
document.querySelector("#restartBtn").addEventListener("click", resetCurrent);
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

function applySolution() {
  for (const device of devices) {
    if (!(device.id in level.solution)) continue;
    if (device.type === "shutter") device.open = level.solution[device.id];
    else device.dir = level.solution[device.id];
  }
  calculateBeams();
}

function completeLevelForTest() {
  applySolution();
  const core = level.cores[level.cores.length - 1];
  player = { x: Math.max(1, core.x - 1), y: core.y };
  checkExit();
}

loadLevel(0);
requestAnimationFrame(draw);
requestAnimationFrame(tick);

window.glassbox = {
  move,
  interact,
  reset: resetCurrent,
  applySolution,
  completeLevelForTest,
  nextLevelForTest() {
    if (levelIndex < levels.length - 1) loadLevel(levelIndex + 1);
  },
  solveAllForTest() {
    for (let i = 0; i < levels.length; i += 1) {
      loadLevel(i);
      completeLevelForTest();
    }
  },
  getState: () => ({
    levelIndex,
    levelCount: levels.length,
    title: level.title,
    lit: level.litCores?.size || 0,
    cores: level.cores.length,
    gates: gates.map((gate) => ({ id: gate.id, open: gate.open })),
    player: { ...player },
    won,
    campaignComplete,
    resets
  })
};
