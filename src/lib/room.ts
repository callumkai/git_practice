import type { OpeningDef, Point, RoomDef } from '../types'
import { pointInPolygon, rectContainsPoint, rectCorners } from './geometry'

/** Polygon used for rendering — the explicit polygon if given, else the rect's corners. */
export function roomPolygon(room: RoomDef): Point[] {
  return room.polygon ?? rectCorners(room.rect)
}

/** All rects used for hit-testing a room (handles compound rooms like Bedroom 2). */
export function roomHitRects(room: RoomDef) {
  return room.extraRects && room.extraRects.length > 0 ? room.extraRects : [room.rect]
}

export function roomContainsPoint(room: RoomDef, point: Point): boolean {
  return roomHitRects(room).some((r) => rectContainsPoint(r, point))
}

/** Point-in-room test using the true polygon (more accurate than the rect union for edge cases). */
export function roomContainsPointExact(room: RoomDef, point: Point): boolean {
  if (room.polygon) return pointInPolygon(point, room.polygon)
  return rectContainsPoint(room.rect, point)
}

/** Wall span (start/end measured along the wall's own axis) for an opening on a given room wall. */
export function openingSpanOnAxis(opening: OpeningDef, axis: 'x' | 'y'): { start: number; end: number } {
  const a = axis === 'x' ? opening.from.x : opening.from.y
  const b = axis === 'x' ? opening.to.x : opening.to.y
  return { start: Math.min(a, b), end: Math.max(a, b) }
}
