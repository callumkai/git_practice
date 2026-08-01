import Dexie, { type Table } from 'dexie'
import type { FurnitureLibraryEntry, HouseSettings, Layout } from '../types'

export class PlannerDb extends Dexie {
  layouts!: Table<Layout, string>
  houseSettings!: Table<HouseSettings & { id: 'singleton' }, string>
  customLibrary!: Table<FurnitureLibraryEntry, string>

  constructor() {
    super('mulberry-grove-planner')
    this.version(1).stores({
      layouts: 'id, roomId',
      houseSettings: 'id',
      customLibrary: 'id',
    })
  }
}

export const db = new PlannerDb()
