import type { FurnitureItem, Point } from '../types'
import { rectCenter, rotatePoint } from './geometry'

/** Depth of the straight (non-chaise) arm of an L-shaped sofa, cm. A shape constant, not a survey figure. */
export const LSOFA_ARM_DEPTH = 90

/**
 * Unrotated L-shaped sofa footprint: a straight run of depth LSOFA_ARM_DEPTH
 * along the top (the full width `w`), with a chaise leg — roughly as wide as
 * the run is deep, matching a real sectional's proportions rather than a
 * deep square — extending forward to the full depth `d` at one end.
 */
function lsofaUnrotatedPolygon(w: number, d: number, chaiseSide: 'left' | 'right'): Point[] {
  const armDepth = Math.min(LSOFA_ARM_DEPTH, d)
  const chaiseWidth = Math.min(armDepth, w)
  if (chaiseSide === 'right') {
    return [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: d },
      { x: w - chaiseWidth, y: d },
      { x: w - chaiseWidth, y: armDepth },
      { x: 0, y: armDepth },
    ]
  }
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: armDepth },
    { x: chaiseWidth, y: armDepth },
    { x: chaiseWidth, y: d },
    { x: 0, y: d },
  ]
}

/** The item's footprint polygon (rect, or true L-shape for corner sofas), rotated about its centre. */
export function itemFootprintPolygon(item: Pick<FurnitureItem, 'x' | 'y' | 'w' | 'd' | 'rotation' | 'category' | 'chaiseSide'>): Point[] {
  const rect = { x: item.x, y: item.y, w: item.w, h: item.d }
  const center = rectCenter(rect)
  const unrotated: Point[] =
    item.category === 'lsofa'
      ? lsofaUnrotatedPolygon(item.w, item.d, item.chaiseSide ?? 'right').map((p) => ({ x: p.x + item.x, y: p.y + item.y }))
      : [
          { x: rect.x, y: rect.y },
          { x: rect.x + rect.w, y: rect.y },
          { x: rect.x + rect.w, y: rect.y + rect.h },
          { x: rect.x, y: rect.y + rect.h },
        ]
  return unrotated.map((p) => rotatePoint(p, center, item.rotation))
}
