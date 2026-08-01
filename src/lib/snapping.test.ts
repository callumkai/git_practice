import { describe, expect, it } from 'vitest'
import { roomById } from '../data/house'
import { computeSnapDelta } from './snapping'
import type { FurnitureItem } from '../types'

function makeItem(overrides: Partial<FurnitureItem> & Pick<FurnitureItem, 'id' | 'x' | 'y' | 'w' | 'd'>): FurnitureItem {
  return { libraryId: 'test', category: 'custom', name: 'Item', rotation: 0, source: 'generic', ...overrides }
}

describe('computeSnapDelta', () => {
  const room = roomById('livingRoom')!

  it('snaps to the near wall when within the threshold', () => {
    const item = makeItem({ id: 'a', x: 5, y: 100, w: 100, d: 50 })
    const { dx, snappedX } = computeSnapDelta(item, room, [], 8)
    expect(snappedX).toBe(true)
    expect(item.x + dx).toBeCloseTo(0)
  })

  it('does not snap when far from any wall or item', () => {
    const item = makeItem({ id: 'a', x: 200, y: 150, w: 100, d: 50 })
    const { dx, dy, snappedX, snappedY } = computeSnapDelta(item, room, [], 8)
    expect(snappedX).toBe(false)
    expect(snappedY).toBe(false)
    expect(dx).toBe(0)
    expect(dy).toBe(0)
  })

  it('snaps against another item edge', () => {
    const other = makeItem({ id: 'b', x: 200, y: 100, w: 100, d: 50 })
    const item = makeItem({ id: 'a', x: 306, y: 100, w: 100, d: 50 })
    const { dx, snappedX } = computeSnapDelta(item, room, [other], 8)
    expect(snappedX).toBe(true)
    expect(item.x + dx).toBeCloseTo(300)
  })
})
