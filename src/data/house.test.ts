import { describe, expect, it } from 'vitest'
import { pointInPolygon } from '../lib/geometry'
import { openingsOnEdge } from '../lib/wallLayout'
import { roomPolygon } from '../lib/room'
import { OPENINGS, ROOMS, resolveOpenings, roomById } from './house'

describe('resolveOpenings', () => {
  it('defaults to the sketch (80cm from the right, 92cm from the left)', () => {
    const resolved = resolveOpenings('right')
    expect(resolved).toBe(OPENINGS)
    const win = resolved.find((o) => o.id === 'bedroom1Window')!
    expect(win.from.x - 213).toBeCloseTo(92)
    expect(514 - win.to.x).toBeCloseTo(80)
  })

  it('flips to the typed note (80cm from the left) without changing the window width', () => {
    const resolved = resolveOpenings('left')
    const win = resolved.find((o) => o.id === 'bedroom1Window')!
    expect(win.from.x - 213).toBeCloseTo(80)
    expect(514 - win.to.x).toBeCloseTo(92)
    expect(win.to.x - win.from.x).toBeCloseTo(129)
  })

  it('leaves every other opening untouched', () => {
    const resolved = resolveOpenings('left')
    const others = resolved.filter((o) => o.id !== 'bedroom1Window')
    const originalOthers = OPENINGS.filter((o) => o.id !== 'bedroom1Window')
    expect(others).toEqual(originalOthers)
  })
})

/**
 * Guards against the "floor plan doesn't connect" bug: a door defined on one
 * room's wall but not reachable from the room it's supposed to swing into,
 * because that room's polygon never actually extends out to meet it (e.g.
 * Landing stopping short of Bedroom 2's wall). Every door must sit fully on
 * an edge of BOTH its serving room and the room it swings into.
 */
describe('every door actually connects its two rooms', () => {
  for (const opening of OPENINGS) {
    if (opening.kind !== 'door' && opening.kind !== 'fittedWardrobe') continue
    if (!opening.swingIntoRoomId) continue

    it(`${opening.id}: sits on a wall shared by ${opening.servesRoomId} and ${opening.swingIntoRoomId}`, () => {
      for (const roomId of [opening.servesRoomId, opening.swingIntoRoomId!]) {
        const room = roomById(roomId)!
        const poly = roomPolygon(room)
        const onSomeEdge = poly.some((a, i) => {
          const b = poly[(i + 1) % poly.length]!
          if (a.y !== b.y && a.x !== b.x) return false
          return openingsOnEdge(a, b, room.floor, [opening]).length > 0
        })
        expect(onSomeEdge, `${opening.id} not found on any edge of ${roomId}`).toBe(true)
      }
    })
  }
})

it('every first-floor room fully tiles its footprint (no room overlaps another)', () => {
  const firstFloorRooms = ROOMS.filter((r) => r.floor === 'first')
  // Cheap grid-sample check: every sampled point should belong to at most one
  // room. Sampled off-integer (x.5/y.5) since every wall in this data is at
  // an integer coordinate and pointInPolygon treats boundaries as inside —
  // an on-the-wall sample would otherwise double-count both of a shared
  // wall's rooms as a false "overlap".
  for (let x = 3.5; x < 514; x += 7) {
    for (let y = 3.5; y < 781; y += 7) {
      const owners = firstFloorRooms.filter((r) => pointInPolygon({ x, y }, roomPolygon(r)))
      expect(owners.length, `(${x},${y}) claimed by ${owners.map((o) => o.id).join(', ') || 'nobody'}`).toBeLessThanOrEqual(1)
    }
  }
})
