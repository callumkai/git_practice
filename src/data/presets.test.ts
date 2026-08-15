import { describe, expect, it } from 'vitest'
import { checkRoomCollisions } from '../lib/collision'
import { OPENINGS, roomById } from './house'
import { buildLivingRoomPresets } from './presets'

describe('living room presets', () => {
  const room = roomById('livingRoom')!

  for (const preset of buildLivingRoomPresets()) {
    it(`${preset.name}: no item extends past the wall or overlaps another`, () => {
      const results = checkRoomCollisions(preset.items, room, OPENINGS)
      for (const r of results) {
        const wallOrOverlap = r.reasons.filter((reason) => reason === 'Extends past the room wall' || reason.startsWith('Overlaps'))
        expect(wallOrOverlap, `${preset.name}: item ${r.itemId} — ${r.reasons.join('; ')}`).toEqual([])
      }
    })
  }
})
