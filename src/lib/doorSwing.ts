import type { OpeningDef, Point } from '../types'
import { roomById } from '../data/house'
import { radToDeg, rectCenter, sectorPolygon, subPoints } from './geometry'

export interface DoorSwing {
  hinge: Point
  /** Point where the leaf rests when closed (flush with the wall). */
  closedEnd: Point
  /** Point where the leaf rests when fully open (perpendicular into the room). */
  openEnd: Point
  radius: number
  startAngleDeg: number
  endAngleDeg: number
  /** SVG elliptical-arc sweep-flag for drawing closedEnd -> openEnd the short way. */
  sweepFlag: 0 | 1
}

/** Computes the quarter-circle swing arc for a door, hinged at its `from` point. */
export function computeDoorSwing(opening: OpeningDef): DoorSwing | null {
  if (opening.kind !== 'door' || !opening.swingIntoRoomId) return null
  const room = roomById(opening.swingIntoRoomId)
  if (!room) return null

  const hinge = opening.from
  const wallVec = subPoints(opening.to, opening.from)
  const wallLen = Math.hypot(wallVec.x, wallVec.y)
  if (wallLen < 1e-6) return null
  const wallUnit = { x: wallVec.x / wallLen, y: wallVec.y / wallLen }

  const perpA = { x: -wallUnit.y, y: wallUnit.x }
  const perpB = { x: wallUnit.y, y: -wallUnit.x }

  const roomCenter = rectCenter(room.rect)
  const toCenter = subPoints(roomCenter, hinge)
  const dotA = toCenter.x * perpA.x + toCenter.y * perpA.y
  const dotB = toCenter.x * perpB.x + toCenter.y * perpB.y
  const chosenPerp = dotA >= dotB ? perpA : perpB

  const radius = opening.size
  const closedEnd = opening.to
  const openEnd = { x: hinge.x + chosenPerp.x * radius, y: hinge.y + chosenPerp.y * radius }

  const startAngleDeg = radToDeg(Math.atan2(wallUnit.y, wallUnit.x))
  const endAngleDeg = radToDeg(Math.atan2(chosenPerp.y, chosenPerp.x))
  const cross = wallUnit.x * chosenPerp.y - wallUnit.y * chosenPerp.x
  const sweepFlag: 0 | 1 = cross > 0 ? 1 : 0

  return { hinge, closedEnd, openEnd, radius, startAngleDeg, endAngleDeg, sweepFlag }
}

/** Polygon approximation of the swing zone, for collision testing against furniture. */
export function doorSwingPolygon(swing: DoorSwing, steps = 12): Point[] {
  return sectorPolygon(swing.hinge, swing.radius, swing.startAngleDeg, swing.endAngleDeg, steps)
}
