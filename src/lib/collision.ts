import type { CollisionResult, FurnitureItem, HouseSettings, OpeningDef, RoomDef } from '../types'
import { computeDoorSwing, doorSwingPolygon } from './doorSwing'
import { computeFittedObstaclePolygon } from './fittedObstacles'
import { itemFootprintPolygon } from './furnitureShape'
import { polygonFullyInside, polygonsOverlap } from './geometry'
import { roomPolygon } from './room'

export function checkRoomCollisions(
  items: FurnitureItem[],
  room: RoomDef,
  openings: OpeningDef[],
  settings: Pick<HouseSettings, 'fittedWardrobeDepth'>,
): CollisionResult[] {
  const roomPoly = roomPolygon(room)

  const fittedObstacles = openings
    .filter((o) => o.kind === 'fittedWardrobe' && o.servesRoomId === room.id)
    .map((o) => ({ label: o.label, polygon: computeFittedObstaclePolygon(o, settings.fittedWardrobeDepth) }))
    .filter((o): o is { label: string; polygon: NonNullable<ReturnType<typeof computeFittedObstaclePolygon>> } => o.polygon !== null)

  const doorSwings = openings
    .filter((o) => o.swingIntoRoomId === room.id)
    .map((o) => {
      const swing = computeDoorSwing(o)
      return swing ? { label: o.label, polygon: doorSwingPolygon(swing) } : null
    })
    .filter((s): s is { label: string; polygon: ReturnType<typeof doorSwingPolygon> } => s !== null)

  return items.map((item) => {
    const footprint = itemFootprintPolygon(item)
    const reasons: string[] = []

    if (!polygonFullyInside(footprint, roomPoly)) {
      reasons.push('Extends past the room wall')
    }

    for (const other of items) {
      if (other.id === item.id) continue
      if (polygonsOverlap(footprint, itemFootprintPolygon(other))) {
        reasons.push(`Overlaps ${other.name}`)
      }
    }

    for (const obstacle of fittedObstacles) {
      if (polygonsOverlap(footprint, obstacle.polygon)) {
        reasons.push(`Overlaps the ${obstacle.label.toLowerCase()}`)
      }
    }

    for (const swing of doorSwings) {
      if (polygonsOverlap(footprint, swing.polygon)) {
        reasons.push(`Blocks the ${swing.label.toLowerCase()} swing`)
      }
    }

    return { itemId: item.id, colliding: reasons.length > 0, reasons }
  })
}
