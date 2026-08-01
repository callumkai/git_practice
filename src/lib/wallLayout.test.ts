import { describe, expect, it } from 'vitest'
import { OPENINGS } from '../data/house'
import { edgeSegments, openingsOnEdge, pointAtEdgeT } from './wallLayout'

describe('openingsOnEdge — living room top wall', () => {
  it('finds the conservatory door and window, positioned as the brief describes', () => {
    const found = openingsOnEdge({ x: 0, y: 0 }, { x: 514, y: 0 }, 'ground', OPENINGS)
    const ids = found.map((f) => f.opening.id)
    expect(ids).toEqual(['conservatoryDoor', 'livingRoomWindow'])
    expect(found[0]).toMatchObject({ start: 111, end: 244 })
    expect(found[1]).toMatchObject({ start: 321, end: 437 })
  })

  it('is direction-aware: reversing the edge mirrors the positions', () => {
    const found = openingsOnEdge({ x: 514, y: 0 }, { x: 0, y: 0 }, 'ground', OPENINGS)
    const door = found.find((f) => f.opening.id === 'conservatoryDoor')!
    // Distance from the new start-point (514,0) to the door's far edge (111,0) is 514-111=403.
    expect(door.start).toBeCloseTo(514 - 244)
    expect(door.end).toBeCloseTo(514 - 111)
  })

  it('ignores openings on a different wall', () => {
    const found = openingsOnEdge({ x: 0, y: 349 }, { x: 0, y: 0 }, 'ground', OPENINGS)
    expect(found).toEqual([])
  })
})

describe('edgeSegments', () => {
  it('produces wall/door/window runs summing to the full edge length, matching 111/77/77', () => {
    const segments = edgeSegments({ x: 0, y: 0 }, { x: 514, y: 0 }, 'ground', OPENINGS)
    const total = segments.reduce((sum, s) => sum + (s.end - s.start), 0)
    expect(total).toBeCloseTo(514)

    const wallLengths = segments.filter((s) => s.kind === 'wall').map((s) => Math.round(s.end - s.start))
    expect(wallLengths).toEqual([111, 77, 77])

    expect(segments.map((s) => s.kind)).toEqual(['wall', 'door', 'wall', 'window', 'wall'])
  })
})

describe('pointAtEdgeT', () => {
  it('interpolates along a horizontal edge', () => {
    expect(pointAtEdgeT({ x: 0, y: 0 }, { x: 100, y: 0 }, 25)).toEqual({ x: 25, y: 0 })
  })

  it('interpolates along a vertical edge', () => {
    const p = pointAtEdgeT({ x: 10, y: 0 }, { x: 10, y: 100 }, 40)
    expect(p.x).toBeCloseTo(10)
    expect(p.y).toBeCloseTo(40)
  })
})
