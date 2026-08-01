import type { Point, Rect } from '../types'

export const EPS = 1e-6

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function addPoints(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function subPoints(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scalePoint(a: Point, s: number): Point {
  return { x: a.x * s, y: a.y * s }
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Rotate point `p` clockwise by `angleDeg` about `center` (screen/SVG coords, y down). */
export function rotatePoint(p: Point, center: Point, angleDeg: number): Point {
  if (angleDeg % 360 === 0) return p
  const rad = degToRad(angleDeg)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = p.x - center.x
  const dy = p.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

export function rectCorners(rect: Rect): Point[] {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ]
}

export function rectCenter(rect: Rect): Point {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
}

/** Oriented 4-corner footprint of an item, rotated clockwise about its own centre. */
export function footprintPolygon(item: { x: number; y: number; w: number; d: number; rotation: number }): Point[] {
  const rect: Rect = { x: item.x, y: item.y, w: item.w, h: item.d }
  const center = rectCenter(rect)
  return rectCorners(rect).map((p) => rotatePoint(p, center, item.rotation))
}

export function polygonBounds(poly: Point[]): Rect {
  const xs = poly.map((p) => p.x)
  const ys = poly.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/** Ray-casting point-in-polygon test. Boundary points are treated as inside. */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = polygon[i]!
    const pj = polygon[j]!
    // Boundary check first so edge/vertex points count as inside.
    if (distanceToSegment(point, pi, pj) < EPS) return true
    const intersects = pi.y > point.y !== pj.y > point.y && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x
    if (intersects) inside = !inside
  }
  return inside
}

export function rectContainsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.x - EPS && point.x <= rect.x + rect.w + EPS && point.y >= rect.y - EPS && point.y <= rect.y + rect.h + EPS
}

export function closestPointOnSegment(p: Point, a: Point, b: Point): Point {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const lenSq = abx * abx + aby * aby
  if (lenSq < EPS) return a
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq
  t = Math.max(0, Math.min(1, t))
  return { x: a.x + abx * t, y: a.y + aby * t }
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  return distance(p, closestPointOnSegment(p, a, b))
}

function onSegment(p: Point, a: Point, b: Point): boolean {
  return Math.min(a.x, b.x) - EPS <= p.x && p.x <= Math.max(a.x, b.x) + EPS && Math.min(a.y, b.y) - EPS <= p.y && p.y <= Math.max(a.y, b.y) + EPS
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

/** True if segments p1-p2 and p3-p4 intersect or touch. */
export function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = cross(p3, p4, p1)
  const d2 = cross(p3, p4, p2)
  const d3 = cross(p1, p2, p3)
  const d4 = cross(p1, p2, p4)

  if (((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))) {
    return true
  }
  if (Math.abs(d1) < EPS && onSegment(p1, p3, p4)) return true
  if (Math.abs(d2) < EPS && onSegment(p2, p3, p4)) return true
  if (Math.abs(d3) < EPS && onSegment(p3, p1, p2)) return true
  if (Math.abs(d4) < EPS && onSegment(p4, p1, p2)) return true
  return false
}

/**
 * General simple-polygon overlap test (works for convex or concave polygons,
 * e.g. L-shaped sofas and door-swing sectors): true if any edges cross, or
 * either polygon contains a vertex of the other.
 */
export function polygonsOverlap(a: Point[], b: Point[]): boolean {
  for (let i = 0; i < a.length; i++) {
    const a1 = a[i]!
    const a2 = a[(i + 1) % a.length]!
    for (let j = 0; j < b.length; j++) {
      const b1 = b[j]!
      const b2 = b[(j + 1) % b.length]!
      if (segmentsIntersect(a1, a2, b1, b2)) return true
    }
  }
  if (a.length > 0 && pointInPolygon(a[0]!, b)) return true
  if (b.length > 0 && pointInPolygon(b[0]!, a)) return true
  return false
}

/** Minimum distance between two convex or concave simple polygons (0 if overlapping). */
export function polygonToPolygonDistance(a: Point[], b: Point[]): number {
  if (polygonsOverlap(a, b)) return 0
  let min = Infinity
  for (let i = 0; i < a.length; i++) {
    const a1 = a[i]!
    const a2 = a[(i + 1) % a.length]!
    for (let j = 0; j < b.length; j++) {
      const b1 = b[j]!
      const b2 = b[(j + 1) % b.length]!
      min = Math.min(
        min,
        distanceToSegment(a1, b1, b2),
        distanceToSegment(a2, b1, b2),
        distanceToSegment(b1, a1, a2),
        distanceToSegment(b2, a1, a2),
      )
    }
  }
  return min
}

/**
 * True if `inner` lies entirely within `outer` (which may be concave, e.g. a
 * room polygon). Samples along each edge rather than just vertices, so an
 * edge bulging out through a concave notch (Bedroom 2's cut corner) is still
 * caught even when its endpoints stay inside. Boundary-touching (furniture
 * flush against a wall) is not flagged, since pointInPolygon treats the
 * boundary itself as inside.
 */
export function polygonFullyInside(inner: Point[], outer: Point[], samplesPerEdge = 8): boolean {
  const n = inner.length
  for (let i = 0; i < n; i++) {
    const a = inner[i]!
    const b = inner[(i + 1) % n]!
    for (let s = 0; s <= samplesPerEdge; s++) {
      const t = s / samplesPerEdge
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      if (!pointInPolygon(p, outer)) return false
    }
  }
  return true
}

/** Minimum distance between a line segment and a polygon (0 if the segment enters it). */
export function segmentToPolygonDistance(a: Point, b: Point, poly: Point[]): number {
  if (pointInPolygon(a, poly) || pointInPolygon(b, poly)) return 0
  let min = Infinity
  for (let i = 0; i < poly.length; i++) {
    const c = poly[i]!
    const d = poly[(i + 1) % poly.length]!
    if (segmentsIntersect(a, b, c, d)) return 0
    min = Math.min(min, distanceToSegment(a, c, d), distanceToSegment(b, c, d), distanceToSegment(c, a, b), distanceToSegment(d, a, b))
  }
  return min
}

export interface WallSegment {
  a: Point
  b: Point
  /** Outward-facing unit normal (points away from the room interior). */
  normal: Point
  length: number
}

/** Wall segments (polygon edges) of a room, outward normals computed from winding. */
export function roomWallSegments(polygon: Point[]): WallSegment[] {
  const segments: WallSegment[] = []
  const n = polygon.length
  // Determine winding via signed area to know which perpendicular is outward.
  let area = 0
  for (let i = 0; i < n; i++) {
    const p1 = polygon[i]!
    const p2 = polygon[(i + 1) % n]!
    area += p1.x * p2.y - p2.x * p1.y
  }
  const clockwise = area > 0 // y-down screen coords
  for (let i = 0; i < n; i++) {
    const a = polygon[i]!
    const b = polygon[(i + 1) % n]!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (len < EPS) continue
    // Perpendicular to the right of travel direction (a->b).
    const rightNormal = { x: dy / len, y: -dx / len }
    const normal = clockwise ? rightNormal : { x: -rightNormal.x, y: -rightNormal.y }
    segments.push({ a, b, normal, length: len })
  }
  return segments
}

export interface WallRun {
  start: number
  end: number
  length: number
}

/**
 * Given a wall of `wallLength` and a set of opening spans along it (each
 * [start, end] measured from the same origin as the wall), return the clear
 * runs of plain wall between them.
 */
export function wallRuns(wallLength: number, openings: { start: number; end: number }[]): WallRun[] {
  const normalized = openings.map((o) => ({ start: Math.min(o.start, o.end), end: Math.max(o.start, o.end) })).sort((a, b) => a.start - b.start)
  const runs: WallRun[] = []
  let cursor = 0
  for (const o of normalized) {
    const clampedStart = Math.max(cursor, o.start)
    if (clampedStart > cursor + EPS) {
      runs.push({ start: cursor, end: clampedStart, length: clampedStart - cursor })
    }
    cursor = Math.max(cursor, o.end)
  }
  if (wallLength > cursor + EPS) {
    runs.push({ start: cursor, end: wallLength, length: wallLength - cursor })
  }
  return runs
}

/** Approximate a circular sector (hinge point, radius, angle range) as a polygon for collision/rendering. */
export function sectorPolygon(center: Point, radius: number, startAngleDeg: number, endAngleDeg: number, steps = 16): Point[] {
  const points: Point[] = [center]
  const start = degToRad(startAngleDeg)
  let end = degToRad(endAngleDeg)
  // Always sweep the short way (<=180deg) between the two angles.
  while (end - start > Math.PI) end -= 2 * Math.PI
  while (end - start < -Math.PI) end += 2 * Math.PI
  for (let i = 0; i <= steps; i++) {
    const t = start + ((end - start) * i) / steps
    points.push({ x: center.x + radius * Math.cos(t), y: center.y + radius * Math.sin(t) })
  }
  return points
}
