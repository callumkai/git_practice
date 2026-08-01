# 4 Mulberry Grove — Room Planner

A room-planning app for a specific house, built from a surveyed floorplan. Lay
out furniture room by room, check whether it fits and whether there's enough
clearance to use it, and export a plan to take to a shop.

## Stack

React + TypeScript + Vite, SVG rendering, Zustand (with a hand-rolled
undo/redo middleware), Dexie (IndexedDB) for local persistence, Tailwind for
UI chrome. No backend — everything runs and saves locally in the browser.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm test         # run the geometry/collision/clearance test suite
npm run build    # production build
```

## What's here

- **House data** (`src/data/house.ts`) — the surveyed room, wall, and opening
  measurements from the estate agent floorplan and site survey. Treated as
  ground truth; never rounded or "tidied".
- **Geometry & rules** (`src/lib/`) — collision detection, clearance rules
  (walkway width, sofa-to-table gap, wardrobe/bed clearance, door swings),
  wall/opening layout, and the TV-sizing helper — all covered by unit tests.
- **Floor plan renderer** (`src/components/FloorPlan/`) — SVG walls, openings,
  door swing arcs, and dimension lines in separate offset lanes so numbers
  never collide.
- **Interaction** — drag, 15° rotate + snap-to-90°, arrow-key nudge, wall/
  furniture snapping, and pinch-zoom anchored at the pinch midpoint.
- **Known unknowns** — a few measurements were never surveyed (the Bedroom 1
  fitted wardrobe depth, the front door / hall / stair-turn widths, and which
  side the Bedroom 1 window sits on). These are marked as estimates on the
  plan and editable under House info, rather than silently guessed.

## Furniture and layouts

Real plan-view shapes (sofas with arms and cushions, true L-shaped corner
sofas, beds, wardrobes, etc.), a custom-item form for anything you're
actually buying, and named layouts per room — including five starting
presets for the living room (Cinema, L-shaped sofa, Long throw, Three-piece,
Floating sofa).

## Export

PNG/SVG snapshot of the current view, print-to-scale (1:50 on A4), and a
plain-text summary of a layout (every item, its size, and its distance from
two reference walls) to take to a shop.
