import Dexie, { type Table } from 'dexie'
import type { FurnitureLibraryEntry, HouseSettings, Layout } from '../types'

export class PlannerDb extends Dexie {
  layouts!: Table<Layout, string>
  houseSettings!: Table<HouseSettings & { id: 'singleton' }, string>
  customLibrary!: Table<FurnitureLibraryEntry, string>

  constructor() {
    // Bumped again (was 'mulberry-grove-planner-v2') — presets were replaced
    // with the user's own 8-option set, so anyone on v2 needs a fresh seed
    // too. See v2's comment: the seed step only runs when a room has no
    // saved layouts yet, so a name bump is what actually forces it.
    super('mulberry-grove-planner-v3')
    this.version(1).stores({
      layouts: 'id, roomId',
      houseSettings: 'id',
      customLibrary: 'id',
    })
  }
}

export const db = new PlannerDb()
