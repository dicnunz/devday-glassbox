# Glassbox: The One-Prompt Escape

An unofficial OpenAI DevDay 2026 contest entry: a static glass-lab light-routing puzzle about freeing a trapped luminous core from a transparent containment maze.

Public build: https://dicnunz.github.io/devday-glassbox/

## What It Is

Glassbox is a seven-level light-routing escape puzzle. The player walks a sealed black-glass laboratory and manipulates mirrors, prisms, shutters, lenses, sensor gates, and moving audit lenses until a living cyan-white beam reaches every trapped core.

Generated art is used as atmosphere and object texture only. Board geometry, beam routing, collisions, gates, hazards, UI text, and win logic are deterministic vanilla JavaScript.

## Play

Open `index.html` or serve the folder:

```bash
python3 -m http.server 4173
```

Then visit `http://127.0.0.1:4173/`.

## Controls

- Arrow keys or WASD.
- Touch arrows on mobile.
- Restart, pause, sound toggle, reduced motion, and About modal are built in.

## Build Receipt

- Built end-to-end with GPT-5.5 in Codex.
- Original assets generated during the task with Image Gen as separate single-purpose images.
- Seven handcrafted levels, each introducing one mechanic and ending in a combined final room.
- Vanilla HTML/CSS/JS.
- No backend, runtime API, tracking, user accounts, paid APIs, card entry, or hidden dependencies.
- Cost ledger: $0.00.
