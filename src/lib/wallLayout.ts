import type { FloorId, OpeningDef, OpeningKind, Point } from '../types'
import { wallRuns } from './geometry'

export interface EdgeOpening {
  opening: OpeningDef
  /** Distance from `a` along the a->b direction, cm. */
  start: number
  end: number
}

/**
 * Openings that lie on the axis-aligned edge a->b, positioned as
 * distance-from-a. `floor` is required (not inferred) because the two
 * floors share the same coordinate range and would otherwise cross-match.
 */
export function openingsOnEdge(a: Point, b: Point, floor: FloorId, openings: OpeningDef[]): EdgeOpening[] {
  const horizontal = Math.abs(a.y - b.y) < 1e-6
  const vertical = Math.abs(a.x - b.x) < 1e-6
  if (!horizontal && !vertical) return []

  const edgeConst = horizontal ? a.y : a.x
  const edgeMin = horizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y)
  const edgeMax = horizontal ? Math.max(a.x, b.x) : Math.max(a.y, b.y)
  const forward = horizontal ? b.x >= a.x : b.y >= a.y

  const results: EdgeOpening[] = []
  for (const o of openings) {
    if (o.floor !== floor) continue
    const oHoriz = Math.abs(o.from.y - o.to.y) < 1e-6
    const oVert = Math.abs(o.from.x - o.to.x) < 1e-6
    const constMatches = horizontal && oHoriz ? Math.abs(o.from.y - edgeConst) < 1e-6 : vertical && oVert ? Math.abs(o.from.x - edgeConst) < 1e-6 : false
    if (!constMatches) continue

    const s = horizontal ? Math.min(o.from.x, o.to.x) : Math.min(o.from.y, o.to.y)
    const e = horizontal ? Math.max(o.from.x, o.to.x) : Math.max(o.from.y, o.to.y)
    if (s < edgeMin - 1e-6 || e > edgeMax + 1e-6) continue

    const start = forward ? s - edgeMin : edgeMax - e
    const end = forward ? e - edgeMin : edgeMax - s
    results.push({ opening: o, start, end })
  }
  return results.sort((x, y) => x.start - y.start)
}

export type EdgeSegment = { kind: 'wall'; start: number; end: number } | { kind: OpeningKind; start: number; end: number; opening: OpeningDef }

/** Full wall-vs-opening breakdown of an edge, in travel order from `a` to `b`. */
export function edgeSegments(a: Point, b: Point, floor: FloorId, openings: OpeningDef[]): EdgeSegment[] {
  const edgeOpenings = openingsOnEdge(a, b, floor, openings)
  const edgeLength = Math.hypot(b.x - a.x, b.y - a.y)
  const wallSpans = wallRuns(edgeLength, edgeOpenings)

  const segments: EdgeSegment[] = [
    ...wallSpans.map((w): EdgeSegment => ({ kind: 'wall', start: w.start, end: w.end })),
    ...edgeOpenings.map((eo): EdgeSegment => ({ kind: eo.opening.kind, start: eo.start, end: eo.end, opening: eo.opening })),
  ]
  return segments.sort((x, y) => x.start - y.start)
}

/** World point at distance `t` from `a`, travelling toward `b`. */
export function pointAtEdgeT(a: Point, b: Point, t: number): Point {
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  if (len < 1e-6) return a
  return { x: a.x + ((b.x - a.x) * t) / len, y: a.y + ((b.y - a.y) * t) / len }
}
