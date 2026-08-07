import Dexie, { type Table } from 'dexie'
import type { FurnitureLibraryEntry, HouseSettings, Layout } from '../types'

export class PlannerDb extends Dexie {
  layouts!: Table<Layout, string>
  houseSettings!: Table<HouseSettings & { id: 'singleton' }, string>
  customLibrary!: Table<FurnitureLibraryEntry, string>

  constructor() {
    // Bumped again (was 'mulberry-grove-planner-v3') — L-shaped sofa
    // dimensions were corrected to a real product's measurements, which
    // changed two presets that use it. See v2's comment: the seed step only
    // runs when a room has no saved layouts yet, so a name bump is what
    // actually forces a fresh one.
    super('mulberry-grove-planner-v4')
    this.version(1).stores({
      layouts: 'id, roomId',
      houseSettings: 'id',
      customLibrary: 'id',
    })
  }
}

export const db = new PlannerDb()
