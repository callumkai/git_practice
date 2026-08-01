import type { FurnitureItem, RoomDef } from '../types'
import { distanceToSegment, polygonBounds } from './geometry'
import { itemFootprintPolygon } from './furnitureShape'
import { roomPolygon } from './room'

export interface SnapResult {
  dx: number
  dy: number
  snappedX: boolean
  snappedY: boolean
}

/**
 * Snap delta for an item's current (x,y): pulls the item's axis-aligned
 * bounding box onto nearby wall or furniture edges within `threshold` cm.
 * Add the returned dx/dy to the item's x/y — translation commutes with
 * rotation about the item's own centre, so this works at any rotation.
 */
export function computeSnapDelta(item: FurnitureItem, room: RoomDef, otherItems: FurnitureItem[], threshold = 8): SnapResult {
  const bounds = polygonBounds(itemFootprintPolygon(item))
  const roomBounds = polygonBounds(roomPolygon(room))

  const targetXs = [roomBounds.x, roomBounds.x + roomBounds.w]
  const targetYs = [roomBounds.y, roomBounds.y + roomBounds.h]
  for (const other of otherItems) {
    if (other.id === item.id) continue
    const ob = polygonBounds(itemFootprintPolygon(other))
    targetXs.push(ob.x, ob.x + ob.w)
    targetYs.push(ob.y, ob.y + ob.h)
  }

  let dx = 0
  let snappedX = false
  let bestXDist = threshold
  for (const tx of targetXs) {
    const distLeft = Math.abs(bounds.x - tx)
    const distRight = Math.abs(bounds.x + bounds.w - tx)
    if (distLeft < bestXDist) {
      bestXDist = distLeft
      dx = tx - bounds.x
      snappedX = true
    }
    if (distRight < bestXDist) {
      bestXDist = distRight
      dx = tx - (bounds.x + bounds.w)
      snappedX = true
    }
  }

  let dy = 0
  let snappedY = false
  let bestYDist = threshold
  for (const ty of targetYs) {
    const distTop = Math.abs(bounds.y - ty)
    const distBottom = Math.abs(bounds.y + bounds.h - ty)
    if (distTop < bestYDist) {
      bestYDist = distTop
      dy = ty - bounds.y
      snappedY = true
    }
    if (distBottom < bestYDist) {
      bestYDist = distBottom
      dy = ty - (bounds.y + bounds.h)
      snappedY = true
    }
  }

  return { dx, dy, snappedX, snappedY }
}

export interface WallDistance {
  edgeIndex: number
  distance: number
}

/** Distance from the item's nearest point to each wall edge of the room, for the live drag readout. */
export function distancesToRoomWalls(item: FurnitureItem, room: RoomDef): WallDistance[] {
  const footprint = itemFootprintPolygon(item)
  const poly = roomPolygon(room)
  return poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length]!
    const distance = Math.min(...footprint.map((p) => distanceToSegment(p, a, b)))
    return { edgeIndex: i, distance }
  })
}
