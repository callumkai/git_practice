import { describe, expect, it } from 'vitest'
import { findAccessWarnings } from './houseAccess'
import type { FurnitureItem } from '../types'

function makeItem(overrides: Partial<FurnitureItem> & Pick<FurnitureItem, 'id' | 'w' | 'd'>): FurnitureItem {
  return { libraryId: 'test', category: 'wardrobe', name: overrides.name ?? overrides.id, x: 0, y: 0, rotation: 0, source: 'generic', ...overrides }
}

describe('findAccessWarnings', () => {
  it('returns nothing when no access measurements have been entered', () => {
    const item = makeItem({ id: 'a', w: 200, d: 200 })
    expect(findAccessWarnings([item], {})).toEqual([])
  })

  it('flags an item wider (on its narrow side) than the front door', () => {
    const item = makeItem({ id: 'a', name: 'Wardrobe', w: 150, d: 65 })
    const warnings = findAccessWarnings([item], { frontDoorWidth: 60 })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.detail).toContain('front door')
  })

  it('does not flag an item that fits through every known constraint', () => {
    const item = makeItem({ id: 'a', w: 150, d: 55 })
    const warnings = findAccessWarnings([item], { frontDoorWidth: 76, narrowestHallWidth: 90 })
    expect(warnings).toEqual([])
  })
})
