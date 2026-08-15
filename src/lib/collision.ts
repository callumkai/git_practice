import type { CollisionResult, FurnitureItem, OpeningDef, RoomDef } from '../types'
import { computeDoorSwing, doorSwingPolygon } from './doorSwing'
import { itemFootprintPolygon } from './furnitureShape'
import { polygonFullyInside, polygonsOverlap } from './geometry'
import { roomPolygon } from './room'

/**
 * Fitted wardrobe doors are treated exactly like real doors here: no solid
 * obstacle (the wardrobe is built into the wall, zero floor depth of its
 * own), just a swing zone furniture can't be placed in — same as every
 * other door.
 */
export function checkRoomCollisions(items: FurnitureItem[], room: RoomDef, openings: OpeningDef[]): CollisionResult[] {
  const roomPoly = roomPolygon(room)

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

    for (const swing of doorSwings) {
      if (polygonsOverlap(footprint, swing.polygon)) {
        reasons.push(`Blocks the ${swing.label.toLowerCase()} swing`)
      }
    }

    return { itemId: item.id, colliding: reasons.length > 0, reasons }
  })
}
