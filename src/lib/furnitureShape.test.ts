import { describe, expect, it } from 'vitest'
import { itemFootprintPolygon, LSOFA_ARM_DEPTH } from './furnitureShape'
import { polygonBounds } from './geometry'
import type { FurnitureItem } from '../types'

function lsofa(overrides: Partial<FurnitureItem>): Pick<FurnitureItem, 'x' | 'y' | 'w' | 'd' | 'rotation' | 'category' | 'chaiseSide'> {
  return { x: 0, y: 0, w: 277, d: 177, rotation: 0, category: 'lsofa', chaiseSide: 'right', ...overrides }
}

describe('L-shaped sofa footprint — real sectional proportions, not a deep square', () => {
  it('gives the chaise a leg width close to the seat depth, not the full sofa depth', () => {
    const poly = itemFootprintPolygon(lsofa({}))
    // The chaise's own width (x-span of its forward-extending leg) should be
    // roughly LSOFA_ARM_DEPTH, not the sofa's full 177cm depth.
    const rightmostXs = poly.filter((p) => p.y > LSOFA_ARM_DEPTH + 1).map((p) => p.x)
    const chaiseLegWidth = Math.max(...rightmostXs) - Math.min(...rightmostXs)
    expect(chaiseLegWidth).toBeCloseTo(LSOFA_ARM_DEPTH)
    expect(chaiseLegWidth).toBeLessThan(177)
  })

  it('keeps the straight run at full width and only LSOFA_ARM_DEPTH deep', () => {
    const poly = itemFootprintPolygon(lsofa({}))
    const bounds = polygonBounds(poly)
    expect(bounds.w).toBeCloseTo(277)
    expect(bounds.h).toBeCloseTo(177)
  })

  it('mirrors correctly for a left chaise', () => {
    const poly = itemFootprintPolygon(lsofa({ chaiseSide: 'left' }))
    const bounds = polygonBounds(poly)
    expect(bounds.w).toBeCloseTo(277)
    expect(bounds.h).toBeCloseTo(177)
    // Chaise leg should sit at the left edge (x near 0) rather than the right.
    const deepPoints = poly.filter((p) => p.y > LSOFA_ARM_DEPTH + 1)
    expect(Math.min(...deepPoints.map((p) => p.x))).toBeCloseTo(0)
  })
})
