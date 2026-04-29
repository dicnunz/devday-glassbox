# Design Restart

The first version was rejected because it made the contest workflow the premise and treated generated images like screenshots pasted under a canvas. This restart changes both.

## Concept

`Glassbox` is now a glass-lab light-routing escape puzzle. A trapped luminous core sits inside a containment maze. The player moves a cursor-like explorer through the lab, rotates nearby prisms, routes a beam through five seals, avoids audit lenses, and exits through the quiet vault.

The contest/build receipt exists only in the About panel and proof docs. It is not the world, mechanic, or joke.

## Visual System

Generated images are used where image generation is actually strong:

- Key art and page atmosphere.
- Board texture, softly mixed behind deterministic grid geometry.
- Single-object vignettes for avatar, core, prism, hazard, and gate.
- Room-card art for the side panel.
- Victory/social preview image.

Generated images are not used for:

- Sprite sheets.
- Exact tile maps.
- UI text.
- Collision geometry.
- Rules.
- Interactive state.

Those are code.

## Current Local Asset Set

- `assets/generated/glass-lab-hero.png`
- `assets/generated/glass-lab-board.png`
- `assets/generated/glass-lab-victory.png`
- `assets/generated/avatar-cursor.png`
- `assets/generated/core-cube.png`
- `assets/generated/prism-node.png`
- `assets/generated/audit-lens.png`
- `assets/generated/glass-gate.png`
- `assets/generated/observatory-card.png`

## Publishing State

This restart is local only until explicitly approved. The old public GitHub Pages deployment still points at the prior version unless and until a new push is approved.
