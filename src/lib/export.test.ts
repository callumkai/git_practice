import { describe, expect, it } from 'vitest'
import { roomById } from '../data/house'
import { layoutSummaryText } from './export'
import type { FurnitureItem } from '../types'

describe('layoutSummaryText', () => {
  it('lists each item with size and distance from the west/north reference walls', () => {
    const room = roomById('livingRoom')!
    const items: FurnitureItem[] = [
      { id: '1', libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, x: 30, y: 40, rotation: 0, source: 'generic' },
    ]
    const text = layoutSummaryText(room, 'Cinema', items)
    expect(text).toContain('Sofa (3-seater)')
    expect(text).toContain('200cm x 90cm')
    expect(text).toContain('30cm')
    expect(text).toContain('40cm')
  })
})
