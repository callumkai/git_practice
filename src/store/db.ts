import Dexie, { type Table } from 'dexie'
import type { FurnitureLibraryEntry, HouseSettings, Layout } from '../types'

export class PlannerDb extends Dexie {
  layouts!: Table<Layout, string>
  houseSettings!: Table<HouseSettings & { id: 'singleton' }, string>
  customLibrary!: Table<FurnitureLibraryEntry, string>

  constructor() {
    // Renamed (was 'mulberry-grove-planner') to force a fresh seed after the
    // living-room presets were reworked — otherwise anyone who'd already
    // opened the app would keep the old, broken presets forever, since the
    // seed step only runs when no layouts exist yet for a room.
    super('mulberry-grove-planner-v2')
    this.version(1).stores({
      layouts: 'id, roomId',
      houseSettings: 'id',
      customLibrary: 'id',
    })
  }
}

export const db = new PlannerDb()
