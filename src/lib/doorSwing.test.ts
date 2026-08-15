import { describe, expect, it } from 'vitest'
import { OPENINGS, ROOMS } from '../data/house'
import { computeDoorSwing, doorSwingPolygon } from './doorSwing'
import { rectContainsPoint } from './geometry'

function opening(id: string) {
  const o = OPENINGS.find((x) => x.id === id)
  if (!o) throw new Error(`missing opening ${id}`)
  return o
}

function room(id: string) {
  const r = ROOMS.find((x) => x.id === id)
  if (!r) throw new Error(`missing room ${id}`)
  return r
}

describe('computeDoorSwing', () => {
  it('sweeps the bedroom 1 door into the bedroom, not the landing', () => {
    const swing = computeDoorSwing(opening('bedroom1Door'))
    expect(swing).not.toBeNull()
    expect(rectContainsPoint(room('bedroom1').rect, swing!.openEnd)).toBe(true)
    expect(rectContainsPoint(room('landing').rect, swing!.openEnd)).toBe(false)
  })

  it('sweeps the en-suite door into the en-suite, not bedroom 1', () => {
    const swing = computeDoorSwing(opening('bedroom1EnsuiteDoor'))
    expect(rectContainsPoint(room('ensuite').rect, swing!.openEnd)).toBe(true)
    expect(rectContainsPoint(room('bedroom1').rect, swing!.openEnd)).toBe(false)
  })

  it('sweeps the hall-to-living-room door into the living room, not the hall', () => {
    const swing = computeDoorSwing(opening('hallToLivingRoomDoor'))
    expect(rectContainsPoint(room('livingRoom').rect, swing!.openEnd)).toBe(true)
    expect(rectContainsPoint(room('hall').rect, swing!.openEnd)).toBe(false)
  })

  it('has a radius equal to the door width', () => {
    const swing = computeDoorSwing(opening('kitchenDoor'))
    expect(swing!.radius).toBe(83)
  })

  it('returns null for windows', () => {
    expect(computeDoorSwing(opening('livingRoomWindow'))).toBeNull()
  })

  it('sweeps both fitted wardrobe doors outward into the bedroom, hinged at the outer edges', () => {
    const left = computeDoorSwing(opening('bedroom1WardrobeDoorLeft'))!
    const right = computeDoorSwing(opening('bedroom1WardrobeDoorRight'))!
    expect(left).not.toBeNull()
    expect(right).not.toBeNull()
    expect(left.radius).toBe(68)
    expect(right.radius).toBe(68)
    expect(rectContainsPoint(room('bedroom1').rect, left.openEnd)).toBe(true)
    expect(rectContainsPoint(room('bedroom1').rect, right.openEnd)).toBe(true)
    // Hinged at the outer edges (221 and 357), not the shared middle (289).
    expect(left.hinge.x).toBe(221)
    expect(right.hinge.x).toBe(357)
  })

  it('produces a swing polygon whose vertices stay within the door radius of the hinge', () => {
    const swing = computeDoorSwing(opening('hallToLivingRoomDoor'))!
    const poly = doorSwingPolygon(swing)
    for (const p of poly) {
      const dist = Math.hypot(p.x - swing.hinge.x, p.y - swing.hinge.y)
      expect(dist).toBeLessThanOrEqual(swing.radius + 1e-6)
    }
  })
})
