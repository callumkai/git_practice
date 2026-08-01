import type { ClearanceResult, FurnitureItem, HouseSettings, OpeningDef, RoomDef } from '../types'
import { computeDoorSwing, doorSwingPolygon } from './doorSwing'
import { itemFootprintPolygon } from './furnitureShape'
import { distance, polygonToPolygonDistance, rotatePoint, segmentToPolygonDistance } from './geometry'
import { roomPolygon } from './room'

export const CLEARANCE_RULES = {
  walkwayMin: 75,
  walkwayPreferred: 90,
  sofaTableMin: 40,
  sofaTableMax: 50,
  wardrobeFront: 60,
  bedSide: 70,
} as const

/**
 * By convention every item's un-rotated footprint has its "front" on the
 * y = d edge (matching how it's dragged in at rotation 0). Rotation carries
 * that edge around with it, same as the L-sofa chaise-side convention.
 */
function frontEdgeAndNormal(item: FurnitureItem): { p1: { x: number; y: number }; p2: { x: number; y: number }; normal: { x: number; y: number } } {
  const footprint = itemFootprintPolygon(item)
  // rectCorners order is [tl, tr, br, bl]; front (y=d) edge is br -> bl.
  const p2 = footprint[2]!
  const p1 = footprint[3]!
  const normal = rotatePoint({ x: 0, y: 1 }, { x: 0, y: 0 }, item.rotation)
  return { p1, p2, normal }
}

function frontClearanceZone(item: FurnitureItem, depth: number) {
  const { p1, p2, normal } = frontEdgeAndNormal(item)
  return [p1, p2, { x: p2.x + normal.x * depth, y: p2.y + normal.y * depth }, { x: p1.x + normal.x * depth, y: p1.y + normal.y * depth }]
}

function sideClearanceZone(item: FurnitureItem, side: 'left' | 'right', depth: number) {
  const footprint = itemFootprintPolygon(item)
  // [tl, tr, br, bl]; left edge = tl->bl, right edge = tr->br.
  const [tl, tr, br, bl] = footprint as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number }]
  const leftNormal = rotatePoint({ x: -1, y: 0 }, { x: 0, y: 0 }, item.rotation)
  const rightNormal = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, item.rotation)
  if (side === 'left') {
    return [tl, bl, { x: bl.x + leftNormal.x * depth, y: bl.y + leftNormal.y * depth }, { x: tl.x + leftNormal.x * depth, y: tl.y + leftNormal.y * depth }]
  }
  return [tr, br, { x: br.x + rightNormal.x * depth, y: br.y + rightNormal.y * depth }, { x: tr.x + rightNormal.x * depth, y: tr.y + rightNormal.y * depth }]
}

function zoneClear(zone: { x: number; y: number }[], item: FurnitureItem, allItems: FurnitureItem[], room: RoomDef): { clearOfFurniture: boolean; withinRoom: boolean } {
  const others = allItems.filter((o) => o.id !== item.id)
  const clearOfFurniture = others.every((o) => polygonToPolygonDistance(zone, itemFootprintPolygon(o)) >= 1e-6)
  const withinRoom = zone.every((p) => insideRoomLoosely(p, room))
  return { clearOfFurniture, withinRoom }
}

function insideRoomLoosely(p: { x: number; y: number }, room: RoomDef): boolean {
  const poly = roomPolygon(room)
  // Generous bounds check (not a strict point-in-polygon) so clearance zones
  // that graze a doorway aren't unfairly failed.
  const xs = poly.map((q) => q.x)
  const ys = poly.map((q) => q.y)
  return p.x >= Math.min(...xs) - 1 && p.x <= Math.max(...xs) + 1 && p.y >= Math.min(...ys) - 1 && p.y <= Math.max(...ys) + 1
}

export function checkWardrobeClearance(item: FurnitureItem, allItems: FurnitureItem[], room: RoomDef): ClearanceResult | null {
  if (item.category !== 'wardrobe' && item.category !== 'chest') return null
  const zone = frontClearanceZone(item, CLEARANCE_RULES.wardrobeFront)
  const { clearOfFurniture, withinRoom } = zoneClear(zone, item, allItems, room)
  const pass = clearOfFurniture && withinRoom
  return {
    ruleId: `wardrobe-front-${item.id}`,
    label: `${item.name}: door-opening clearance`,
    pass,
    detail: pass
      ? `${CLEARANCE_RULES.wardrobeFront}cm clear in front to open it.`
      : !withinRoom
        ? `Needs ${CLEARANCE_RULES.wardrobeFront}cm in front, but that runs past the room wall.`
        : `Needs ${CLEARANCE_RULES.wardrobeFront}cm in front; another item is in the way.`,
    itemIds: [item.id],
  }
}

export function checkBedClearance(item: FurnitureItem, allItems: FurnitureItem[], room: RoomDef): ClearanceResult | null {
  if (item.category !== 'bed') return null
  const leftZone = sideClearanceZone(item, 'left', CLEARANCE_RULES.bedSide)
  const rightZone = sideClearanceZone(item, 'right', CLEARANCE_RULES.bedSide)
  const left = zoneClear(leftZone, item, allItems, room)
  const right = zoneClear(rightZone, item, allItems, room)
  const sidePass = (left.clearOfFurniture && left.withinRoom) || (right.clearOfFurniture && right.withinRoom)

  const footZone = frontClearanceZone(item, CLEARANCE_RULES.bedSide)
  const wardrobeAtFoot = allItems.some(
    (o) => (o.category === 'wardrobe' || o.category === 'chest') && o.id !== item.id && polygonToPolygonDistance(footZone, itemFootprintPolygon(o)) < 30,
  )
  const foot = zoneClear(footZone, item, allItems, room)
  const footPass = !wardrobeAtFoot || (foot.clearOfFurniture && foot.withinRoom)

  const pass = sidePass && footPass
  const details: string[] = []
  if (!sidePass) details.push(`Needs ${CLEARANCE_RULES.bedSide}cm clear on at least one side.`)
  if (wardrobeAtFoot && !footPass) details.push(`Wardrobe at the foot needs ${CLEARANCE_RULES.bedSide}cm clear to open.`)
  if (pass) details.push(`${CLEARANCE_RULES.bedSide}cm clear on at least one side.`)

  return {
    ruleId: `bed-clearance-${item.id}`,
    label: `${item.name}: bed clearance`,
    pass,
    detail: details.join(' '),
    itemIds: [item.id],
  }
}

export function checkSofaTableClearance(sofa: FurnitureItem, allItems: FurnitureItem[]): ClearanceResult | null {
  if (sofa.category !== 'sofa' && sofa.category !== 'lsofa') return null
  const tables = allItems.filter((o) => o.category === 'coffeeTable')
  if (tables.length === 0) return null

  const sofaFront = frontEdgeAndNormal(sofa)
  let nearest: { table: FurnitureItem; gap: number } | null = null
  for (const table of tables) {
    const gap = polygonToPolygonDistance([sofaFront.p1, sofaFront.p2], itemFootprintPolygon(table))
    if (!nearest || gap < nearest.gap) nearest = { table, gap }
  }
  if (!nearest) return null

  const pass = nearest.gap >= CLEARANCE_RULES.sofaTableMin && nearest.gap <= CLEARANCE_RULES.sofaTableMax
  return {
    ruleId: `sofa-table-${sofa.id}`,
    label: `${sofa.name} to ${nearest.table.name}`,
    pass,
    detail: `${Math.round(nearest.gap)}cm gap (want ${CLEARANCE_RULES.sofaTableMin}-${CLEARANCE_RULES.sofaTableMax}cm).`,
    itemIds: [sofa.id, nearest.table.id],
  }
}

/**
 * Approximate walkway clearance between pairs of doors on a room: measures
 * the shortest distance from the direct line between the two doorways to any
 * piece of furniture, doubled as a stand-in for corridor width. This is a
 * heuristic, not an exact corridor-width solve — labelled as approximate.
 */
export function checkWalkwayClearance(room: RoomDef, openings: OpeningDef[], items: FurnitureItem[]): ClearanceResult[] {
  const doors = openings.filter((o) => o.kind === 'door' && (o.servesRoomId === room.id || o.swingIntoRoomId === room.id))
  const results: ClearanceResult[] = []
  for (let i = 0; i < doors.length; i++) {
    for (let j = i + 1; j < doors.length; j++) {
      const a = doors[i]!
      const b = doors[j]!
      const midA = { x: (a.from.x + a.to.x) / 2, y: (a.from.y + a.to.y) / 2 }
      const midB = { x: (b.from.x + b.to.x) / 2, y: (b.from.y + b.to.y) / 2 }
      let minDist = Infinity
      for (const item of items) {
        const d = segmentToPolygonDistance(midA, midB, itemFootprintPolygon(item))
        minDist = Math.min(minDist, d)
      }
      const achieved = Number.isFinite(minDist) ? minDist * 2 : distance(midA, midB)
      const pass = achieved >= CLEARANCE_RULES.walkwayMin
      results.push({
        ruleId: `walkway-${a.id}-${b.id}`,
        label: `Walkway: ${a.label} ↔ ${b.label} (approx.)`,
        pass,
        detail: pass
          ? `~${Math.round(achieved)}cm clear${achieved < CLEARANCE_RULES.walkwayPreferred ? ` (below the ${CLEARANCE_RULES.walkwayPreferred}cm preferred, but above the ${CLEARANCE_RULES.walkwayMin}cm minimum)` : ''}.`
          : `~${Math.round(achieved)}cm clear — below the ${CLEARANCE_RULES.walkwayMin}cm minimum.`,
        itemIds: [],
      })
    }
  }
  return results
}

export function checkDoorSwingClearance(room: RoomDef, openings: OpeningDef[], items: FurnitureItem[]): ClearanceResult[] {
  const swingOpenings = openings.filter((o) => o.swingIntoRoomId === room.id)
  const results: ClearanceResult[] = []
  for (const opening of swingOpenings) {
    const swing = computeDoorSwing(opening)
    if (!swing) continue
    const swingPoly = doorSwingPolygon(swing)
    const blocking = items.filter((item) => polygonToPolygonDistance(swingPoly, itemFootprintPolygon(item)) < 1e-6)
    results.push({
      ruleId: `door-swing-${opening.id}`,
      label: `${opening.label} swing clear`,
      pass: blocking.length === 0,
      detail: blocking.length === 0 ? 'Nothing blocks the door swing.' : `${blocking.map((b) => b.name).join(', ')} block${blocking.length === 1 ? 's' : ''} the swing.`,
      itemIds: blocking.map((b) => b.id),
    })
  }
  return results
}

export function runClearanceChecks(room: RoomDef, items: FurnitureItem[], openings: OpeningDef[], _settings: HouseSettings): ClearanceResult[] {
  const results: ClearanceResult[] = []
  for (const item of items) {
    const w = checkWardrobeClearance(item, items, room)
    if (w) results.push(w)
    const bed = checkBedClearance(item, items, room)
    if (bed) results.push(bed)
    const sofa = checkSofaTableClearance(item, items)
    if (sofa) results.push(sofa)
  }
  results.push(...checkWalkwayClearance(room, openings, items))
  results.push(...checkDoorSwingClearance(room, openings, items))
  return results
}
