import { describe, expect, it } from 'vitest'
import { OPENINGS, openingsForRoom, roomById } from '../data/house'
import { checkRoomCollisions } from './collision'
import type { FurnitureItem } from '../types'

function makeItem(overrides: Partial<FurnitureItem> & Pick<FurnitureItem, 'id' | 'x' | 'y' | 'w' | 'd'>): FurnitureItem {
  return {
    libraryId: 'test',
    category: 'custom',
    name: overrides.name ?? overrides.id,
    rotation: 0,
    source: 'generic',
    ...overrides,
  }
}

describe('checkRoomCollisions', () => {
  it('reports no collision for a well-placed lone item', () => {
    const room = roomById('kitchenDining')!
    const item = makeItem({ id: 'a', x: 400, y: 600, w: 60, d: 60 })
    const results = checkRoomCollisions([item], room, OPENINGS)
    expect(results[0]!.colliding).toBe(false)
  })

  it('flags an item that extends past the room wall', () => {
    const room = roomById('kitchenDining')!
    const item = makeItem({ id: 'a', x: -100, y: 600, w: 60, d: 60 })
    const results = checkRoomCollisions([item], room, OPENINGS)
    expect(results[0]!.colliding).toBe(true)
    expect(results[0]!.reasons).toContain('Extends past the room wall')
  })

  it('flags two overlapping items against each other, naming the other item', () => {
    const room = roomById('kitchenDining')!
    const a = makeItem({ id: 'a', name: 'Sofa', x: 300, y: 600, w: 100, d: 100 })
    const b = makeItem({ id: 'b', name: 'Coffee table', x: 350, y: 650, w: 60, d: 60 })
    const results = checkRoomCollisions([a, b], room, OPENINGS)
    const forA = results.find((r) => r.itemId === 'a')!
    const forB = results.find((r) => r.itemId === 'b')!
    expect(forA.colliding).toBe(true)
    expect(forA.reasons.some((r) => r.includes('Coffee table'))).toBe(true)
    expect(forB.reasons.some((r) => r.includes('Sofa'))).toBe(true)
  })

  it('flags an item placed inside the kitchen door swing', () => {
    const room = roomById('kitchenDining')!
    const item = makeItem({ id: 'a', x: 240, y: 410, w: 20, d: 20 })
    const results = checkRoomCollisions([item], room, OPENINGS)
    expect(results[0]!.colliding).toBe(true)
    expect(results[0]!.reasons.some((r) => r.toLowerCase().includes('swing'))).toBe(true)
  })

  it('flags an item inside the fitted wardrobe left door swing, built into the wall (no solid obstacle)', () => {
    const room = roomById('bedroom1')!
    // Hinge at (221,460), radius 68 — well inside the left leaf's quarter-circle swing.
    const item = makeItem({ id: 'a', x: 235, y: 465, w: 15, d: 15 })
    const results = checkRoomCollisions([item], room, openingsForRoom('bedroom1'))
    expect(results[0]!.colliding).toBe(true)
    expect(results[0]!.reasons.some((r) => r.includes('wardrobe'))).toBe(true)
  })

  it('does not flag a wardrobe collision deep in the room, away from either door swing', () => {
    const room = roomById('bedroom1')!
    const item = makeItem({ id: 'a', x: 250, y: 700, w: 20, d: 20 })
    const results = checkRoomCollisions([item], room, openingsForRoom('bedroom1'))
    expect(results[0]!.reasons.some((r) => r.includes('wardrobe'))).toBe(false)
  })

  it('handles the non-rectangular Bedroom 2 room without false wall-collision', () => {
    const room = roomById('bedroom2')!
    // Sits in the notch that was cut away from the top-left — must not be treated as inside.
    const notchItem = makeItem({ id: 'a', x: 260, y: 10, w: 20, d: 20 })
    const results = checkRoomCollisions([notchItem], room, [])
    expect(results[0]!.colliding).toBe(true)
    expect(results[0]!.reasons).toContain('Extends past the room wall')
  })
})
