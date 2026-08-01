import type { OpeningDef, Point } from '../types'
import { roomById } from '../data/house'
import { rectCenter, subPoints } from './geometry'

/**
 * Footprint of a fitted (built-in) wardrobe: a rect protruding from its wall
 * span into the room it serves, by `depth`. The brief gives the wall span
 * (136cm) but never surveyed the depth, so callers must supply an explicit,
 * user-editable estimate rather than a hardcoded guess.
 */
export function computeFittedObstaclePolygon(opening: OpeningDef, depth: number): Point[] | null {
  if (opening.kind !== 'fittedWardrobe') return null
  const room = roomById(opening.servesRoomId)
  if (!room) return null

  const wallVec = subPoints(opening.to, opening.from)
  const wallLen = Math.hypot(wallVec.x, wallVec.y)
  if (wallLen < 1e-6) return null
  const wallUnit = { x: wallVec.x / wallLen, y: wallVec.y / wallLen }
  const perpA = { x: -wallUnit.y, y: wallUnit.x }
  const perpB = { x: wallUnit.y, y: -wallUnit.x }

  const mid = { x: (opening.from.x + opening.to.x) / 2, y: (opening.from.y + opening.to.y) / 2 }
  const roomCenter = rectCenter(room.rect)
  const toCenter = subPoints(roomCenter, mid)
  const dotA = toCenter.x * perpA.x + toCenter.y * perpA.y
  const dotB = toCenter.x * perpB.x + toCenter.y * perpB.y
  const inward = dotA >= dotB ? perpA : perpB

  const p1 = opening.from
  const p2 = opening.to
  const p3: Point = { x: p2.x + inward.x * depth, y: p2.y + inward.y * depth }
  const p4: Point = { x: p1.x + inward.x * depth, y: p1.y + inward.y * depth }
  return [p1, p2, p3, p4]
}
