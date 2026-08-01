import { describe, expect, it } from 'vitest'
import {
  distanceToSegment,
  footprintPolygon,
  pointInPolygon,
  polygonBounds,
  polygonsOverlap,
  polygonToPolygonDistance,
  rectCorners,
  rotatePoint,
  segmentsIntersect,
  wallRuns,
} from './geometry'

describe('rotatePoint', () => {
  it('leaves a point unchanged at 0 degrees', () => {
    expect(rotatePoint({ x: 10, y: 5 }, { x: 0, y: 0 }, 0)).toEqual({ x: 10, y: 5 })
  })

  it('rotates 90deg clockwise about origin (screen coords)', () => {
    const p = rotatePoint({ x: 10, y: 0 }, { x: 0, y: 0 }, 90)
    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(10)
  })

  it('rotates 180deg about a non-origin centre', () => {
    const p = rotatePoint({ x: 10, y: 10 }, { x: 5, y: 5 }, 180)
    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(0)
  })
})

describe('footprintPolygon', () => {
  it('produces axis-aligned corners at rotation 0', () => {
    const poly = footprintPolygon({ x: 0, y: 0, w: 240, d: 90, rotation: 0 })
    expect(poly).toEqual([
      { x: 0, y: 0 },
      { x: 240, y: 0 },
      { x: 240, y: 90 },
      { x: 0, y: 90 },
    ])
  })

  it('swaps footprint bounds at 90deg rotation', () => {
    const poly = footprintPolygon({ x: 0, y: 0, w: 240, d: 90, rotation: 90 })
    const bounds = polygonBounds(poly)
    expect(bounds.w).toBeCloseTo(90)
    expect(bounds.h).toBeCloseTo(240)
  })
})

describe('pointInPolygon', () => {
  const square = rectCorners({ x: 0, y: 0, w: 100, h: 100 })

  it('detects an interior point', () => {
    expect(pointInPolygon({ x: 50, y: 50 }, square)).toBe(true)
  })

  it('detects an exterior point', () => {
    expect(pointInPolygon({ x: 150, y: 50 }, square)).toBe(false)
  })

  it('treats boundary points as inside', () => {
    expect(pointInPolygon({ x: 0, y: 50 }, square)).toBe(true)
  })
})

describe('segmentsIntersect', () => {
  it('detects a crossing', () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true)
  })

  it('detects parallel non-touching segments as not intersecting', () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBe(false)
  })
})

describe('polygonsOverlap — the coffee table / sofa regression', () => {
  it('flags a coffee table that visually overlaps a sofa', () => {
    const sofa = rectCorners({ x: 0, y: 0, w: 220, h: 90 })
    const coffeeTable = rectCorners({ x: 100, y: 80, w: 120, h: 60 })
    expect(polygonsOverlap(sofa, coffeeTable)).toBe(true)
  })

  it('does not flag furniture with a clear gap', () => {
    const sofa = rectCorners({ x: 0, y: 0, w: 220, h: 90 })
    const coffeeTable = rectCorners({ x: 0, y: 140, w: 120, h: 60 })
    expect(polygonsOverlap(sofa, coffeeTable)).toBe(false)
  })

  it('detects containment when one polygon is fully inside another', () => {
    const outer = rectCorners({ x: 0, y: 0, w: 200, h: 200 })
    const inner = rectCorners({ x: 50, y: 50, w: 20, h: 20 })
    expect(polygonsOverlap(outer, inner)).toBe(true)
  })
})

describe('polygonToPolygonDistance', () => {
  it('returns 0 for overlapping polygons', () => {
    const a = rectCorners({ x: 0, y: 0, w: 100, h: 100 })
    const b = rectCorners({ x: 50, y: 50, w: 100, h: 100 })
    expect(polygonToPolygonDistance(a, b)).toBe(0)
  })

  it('returns the gap between two separated rects', () => {
    const a = rectCorners({ x: 0, y: 0, w: 100, h: 100 })
    const b = rectCorners({ x: 150, y: 0, w: 100, h: 100 })
    expect(polygonToPolygonDistance(a, b)).toBeCloseTo(50)
  })
})

describe('distanceToSegment', () => {
  it('measures perpendicular distance to a wall line', () => {
    const d = distanceToSegment({ x: 50, y: 30 }, { x: 0, y: 0 }, { x: 100, y: 0 })
    expect(d).toBeCloseTo(30)
  })
})

describe('wallRuns — living room rear wall from the brief', () => {
  it('splits the 514 top wall into 111 / 77 / 77 around the conservatory door and window', () => {
    const runs = wallRuns(514, [
      { start: 111, end: 244 }, // conservatory door
      { start: 321, end: 437 }, // living room window
    ])
    expect(runs.map((r) => Math.round(r.length))).toEqual([111, 77, 77])
  })

  it('handles unordered openings', () => {
    const runs = wallRuns(300, [
      { start: 200, end: 250 },
      { start: 50, end: 100 },
    ])
    expect(runs.map((r) => Math.round(r.length))).toEqual([50, 100, 50])
  })

  it('handles a wall with no openings', () => {
    const runs = wallRuns(300, [])
    expect(runs).toEqual([{ start: 0, end: 300, length: 300 }])
  })
})
