import { describe, expect, it } from 'vitest'
import { roomById } from '../data/house'
import { checkBedClearance, checkSofaTableClearance, checkWardrobeClearance } from './clearance'
import type { FurnitureItem } from '../types'

function makeItem(overrides: Partial<FurnitureItem> & Pick<FurnitureItem, 'id' | 'x' | 'y' | 'w' | 'd' | 'category'>): FurnitureItem {
  return {
    libraryId: 'test',
    name: overrides.name ?? overrides.id,
    rotation: 0,
    source: 'generic',
    ...overrides,
  }
}

describe('checkWardrobeClearance', () => {
  const room = roomById('bedroom1')!

  it('passes with 60cm clear in front', () => {
    const wardrobe = makeItem({ id: 'w', category: 'wardrobe', x: 250, y: 500, w: 100, d: 60 })
    const result = checkWardrobeClearance(wardrobe, [wardrobe], room)
    expect(result?.pass).toBe(true)
  })

  it('fails when another item sits in the 60cm zone', () => {
    const wardrobe = makeItem({ id: 'w', category: 'wardrobe', x: 250, y: 500, w: 100, d: 60 })
    const chair = makeItem({ id: 'c', category: 'custom', x: 260, y: 570, w: 40, d: 40 })
    const result = checkWardrobeClearance(wardrobe, [wardrobe, chair], room)
    expect(result?.pass).toBe(false)
  })

  it('is null for non-wardrobe/chest categories', () => {
    const sofa = makeItem({ id: 's', category: 'sofa', x: 0, y: 0, w: 200, d: 90 })
    expect(checkWardrobeClearance(sofa, [sofa], room)).toBeNull()
  })
})

describe('checkBedClearance — my bed (160x210), confirmed to fit in Bedroom 1', () => {
  const room = roomById('bedroom1')!

  it('passes when there is 70cm clear on at least one side', () => {
    // Bedroom 1 is 301 wide; placing the 160cm bed near one wall leaves >70 on the other side.
    const bed = makeItem({ id: 'bed', category: 'bed', x: 220, y: 480, w: 160, d: 210 })
    const result = checkBedClearance(bed, [bed], room)
    expect(result?.pass).toBe(true)
  })

  it('fails when both sides are blocked to under 70cm', () => {
    const bed = makeItem({ id: 'bed', category: 'bed', x: 220, y: 480, w: 160, d: 210 })
    const leftBlock = makeItem({ id: 'l', category: 'custom', x: 200, y: 500, w: 15, d: 100 })
    const rightBlock = makeItem({ id: 'r', category: 'custom', x: 385, y: 500, w: 15, d: 100 })
    const result = checkBedClearance(bed, [bed, leftBlock, rightBlock], room)
    expect(result?.pass).toBe(false)
  })

  it('requires foot clearance only when a wardrobe sits at the foot', () => {
    const bed = makeItem({ id: 'bed', category: 'bed', x: 220, y: 480, w: 160, d: 210 })
    const withoutWardrobe = checkBedClearance(bed, [bed], room)
    expect(withoutWardrobe?.pass).toBe(true)

    const wardrobeAtFoot = makeItem({ id: 'w', category: 'wardrobe', x: 220, y: 695, w: 100, d: 30 })
    const withWardrobe = checkBedClearance(bed, [bed, wardrobeAtFoot], room)
    expect(withWardrobe?.detail).toContain('foot')
  })
})

describe('checkSofaTableClearance', () => {
  it('passes within the 40-50cm band', () => {
    const sofa = makeItem({ id: 's', category: 'sofa', x: 0, y: 0, w: 220, d: 90 })
    const table = makeItem({ id: 't', category: 'coffeeTable', x: 40, y: 135, w: 120, d: 60 })
    const result = checkSofaTableClearance(sofa, [sofa, table])
    expect(result?.pass).toBe(true)
  })

  it('fails when the table is jammed against the sofa (the regression from the brief)', () => {
    const sofa = makeItem({ id: 's', category: 'sofa', x: 0, y: 0, w: 220, d: 90 })
    const table = makeItem({ id: 't', category: 'coffeeTable', x: 40, y: 80, w: 120, d: 60 })
    const result = checkSofaTableClearance(sofa, [sofa, table])
    expect(result?.pass).toBe(false)
  })

  it('is null when there is no coffee table in the room', () => {
    const sofa = makeItem({ id: 's', category: 'sofa', x: 0, y: 0, w: 220, d: 90 })
    expect(checkSofaTableClearance(sofa, [sofa])).toBeNull()
  })
})
