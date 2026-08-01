import type { FloorId, OpeningDef, Point, RoomDef } from '../types'
import { formatCm } from './format'
import { edgeSegments, pointAtEdgeT } from './wallLayout'
import { roomPolygon } from './room'

export interface DimensionLine {
  id: string
  a: Point
  b: Point
  midpoint: Point
  label: string
  estimated: boolean
}

function polygonCentroid(poly: Point[]): Point {
  const sum = poly.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / poly.length, y: sum.y / poly.length }
}

const KIND_LABEL: Record<string, string> = { door: 'Door', window: 'Window', fittedWardrobe: 'Wardrobe' }

/**
 * Wall-length and opening-size dimension lines for a room, in two separate
 * offset lanes so the numbers never collide (brief's legibility requirement).
 */
export function roomDimensionLines(
  room: RoomDef,
  floor: FloorId,
  openings: OpeningDef[],
  laneOffsets: { wall: number; opening: number } = { wall: 24, opening: 48 },
): { wallLines: DimensionLine[]; openingLines: DimensionLine[] } {
  const poly = roomPolygon(room)
  const centroid = polygonCentroid(poly)
  const wallLines: DimensionLine[] = []
  const openingLines: DimensionLine[] = []

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (len < 1e-6) continue

    const rawNormal = { x: dy / len, y: -dx / len }
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const towardCentroid = { x: centroid.x - mid.x, y: centroid.y - mid.y }
    const sign = rawNormal.x * towardCentroid.x + rawNormal.y * towardCentroid.y > 0 ? 1 : -1
    const normal = { x: rawNormal.x * -sign, y: rawNormal.y * -sign } // outward, away from centroid

    const segments = edgeSegments(a, b, floor, openings)
    for (const seg of segments) {
      const p1 = pointAtEdgeT(a, b, seg.start)
      const p2 = pointAtEdgeT(a, b, seg.end)
      const offset = seg.kind === 'wall' ? laneOffsets.wall : laneOffsets.opening
      const withOffset = (p: Point) => ({ x: p.x + normal.x * offset, y: p.y + normal.y * offset })
      const lineA = withOffset(p1)
      const lineB = withOffset(p2)
      const midpoint = { x: (lineA.x + lineB.x) / 2, y: (lineA.y + lineB.y) / 2 }
      const length = seg.end - seg.start

      if (seg.kind === 'wall') {
        wallLines.push({ id: `${room.id}-wall-${i}-${seg.start}`, a: lineA, b: lineB, midpoint, label: formatCm(length), estimated: false })
      } else {
        const kindLabel = KIND_LABEL[seg.kind] ?? seg.kind
        openingLines.push({
          id: `${room.id}-opening-${seg.opening.id}`,
          a: lineA,
          b: lineB,
          midpoint,
          label: `${kindLabel} ${formatCm(seg.opening.size)}`,
          estimated: Boolean(seg.opening.positionEstimated),
        })
      }
    }
  }

  return { wallLines, openingLines }
}
