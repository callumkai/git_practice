import { create } from 'zustand'
import { buildLivingRoomPresets } from '../data/presets'
import type { FloorId, FurnitureItem, FurnitureLibraryEntry, HouseSettings, Layout } from '../types'
import { db } from './db'
import { temporal, type TemporalSlice } from './temporal'

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const DEFAULT_HOUSE_SETTINGS: HouseSettings = {
  bedroom1WindowSide: 'right',
}

interface PlannerState {
  hydrated: boolean
  floor: FloorId
  roomId: string | null
  layouts: Layout[]
  activeLayoutIdByRoom: Record<string, string>
  selectedItemId: string | null
  snapEnabled: boolean
  showDimensions: boolean
  houseSettings: HouseSettings
  customLibrary: FurnitureLibraryEntry[]
  compare: { roomId: string; layoutIdA: string; layoutIdB: string } | null

  hydrate: () => Promise<void>
  setFloor: (floor: FloorId) => void
  setRoom: (roomId: string | null) => void
  selectItem: (itemId: string | null) => void
  setSnapEnabled: (v: boolean) => void
  setShowDimensions: (v: boolean) => void

  ensureRoomLayout: (roomId: string) => string
  switchActiveLayout: (roomId: string, layoutId: string) => void
  createLayout: (roomId: string, name: string) => string
  duplicateLayout: (layoutId: string) => string
  renameLayout: (layoutId: string, name: string) => void
  deleteLayout: (layoutId: string) => void

  addItem: (roomId: string, entry: FurnitureLibraryEntry, x: number, y: number) => string
  removeItem: (roomId: string, itemId: string) => void
  beginDrag: () => void
  moveItemLive: (roomId: string, itemId: string, x: number, y: number) => void
  endDrag: (roomId: string) => void
  rotateItem: (roomId: string, itemId: string, rotation: number) => void
  updateItem: (roomId: string, itemId: string, patch: Partial<FurnitureItem>) => void

  updateHouseSettings: (patch: Partial<HouseSettings>) => void
  addCustomLibraryEntry: (entry: FurnitureLibraryEntry) => void

  setCompare: (compare: PlannerState['compare']) => void

  exportJSON: () => string
  importJSON: (json: string) => Promise<void>
}

function persistLayout(layout: Layout) {
  void db.layouts.put(layout)
}

function findLayout(layouts: Layout[], id: string): Layout | undefined {
  return layouts.find((l) => l.id === id)
}

export const useStore = create<PlannerState & TemporalSlice>()(
  temporal(
    (set, get) => ({
      hydrated: false,
      floor: 'ground',
      roomId: null,
      layouts: [],
      activeLayoutIdByRoom: {},
      selectedItemId: null,
      snapEnabled: true,
      showDimensions: true,
      houseSettings: DEFAULT_HOUSE_SETTINGS,
      customLibrary: [],
      compare: null,

      hydrate: async () => {
        const [storedLayouts, storedSettings, storedCustom] = await Promise.all([db.layouts.toArray(), db.houseSettings.get('singleton'), db.customLibrary.toArray()])

        let layouts = storedLayouts
        const activeLayoutIdByRoom: Record<string, string> = {}

        const hasLivingRoomLayouts = layouts.some((l) => l.roomId === 'livingRoom')
        if (!hasLivingRoomLayouts) {
          const presets = buildLivingRoomPresets()
          const now = Date.now()
          const presetLayouts: Layout[] = presets.map((p) => ({
            id: uid(),
            roomId: 'livingRoom',
            name: p.name,
            items: p.items,
            createdAt: now,
            updatedAt: now,
            isPreset: true,
          }))
          layouts = [...layouts, ...presetLayouts]
          for (const l of presetLayouts) void db.layouts.put(l)
          activeLayoutIdByRoom.livingRoom = presetLayouts[0]!.id
        }

        for (const l of layouts) {
          if (!(l.roomId in activeLayoutIdByRoom)) activeLayoutIdByRoom[l.roomId] = l.id
        }

        set({
          layouts,
          activeLayoutIdByRoom,
          houseSettings: storedSettings ? { ...DEFAULT_HOUSE_SETTINGS, ...storedSettings } : DEFAULT_HOUSE_SETTINGS,
          customLibrary: storedCustom,
          hydrated: true,
        })
      },

      setFloor: (floor) => set({ floor, roomId: null, selectedItemId: null }),
      setRoom: (roomId) => set({ roomId, selectedItemId: null }),
      selectItem: (selectedItemId) => set({ selectedItemId }),
      setSnapEnabled: (snapEnabled) => set({ snapEnabled }),
      setShowDimensions: (showDimensions) => set({ showDimensions }),

      ensureRoomLayout: (roomId) => {
        const state = get()
        const existingActive = state.activeLayoutIdByRoom[roomId]
        if (existingActive && findLayout(state.layouts, existingActive)) return existingActive
        const existing = state.layouts.find((l) => l.roomId === roomId)
        if (existing) {
          set({ activeLayoutIdByRoom: { ...state.activeLayoutIdByRoom, [roomId]: existing.id } })
          return existing.id
        }
        const now = Date.now()
        const layout: Layout = { id: uid(), roomId, name: 'Layout 1', items: [], createdAt: now, updatedAt: now }
        persistLayout(layout)
        set({ layouts: [...state.layouts, layout], activeLayoutIdByRoom: { ...state.activeLayoutIdByRoom, [roomId]: layout.id } })
        return layout.id
      },

      switchActiveLayout: (roomId, layoutId) => {
        set({ activeLayoutIdByRoom: { ...get().activeLayoutIdByRoom, [roomId]: layoutId }, selectedItemId: null })
      },

      createLayout: (roomId, name) => {
        get().checkpoint()
        const now = Date.now()
        const layout: Layout = { id: uid(), roomId, name, items: [], createdAt: now, updatedAt: now }
        persistLayout(layout)
        set((s) => ({ layouts: [...s.layouts, layout], activeLayoutIdByRoom: { ...s.activeLayoutIdByRoom, [roomId]: layout.id } }))
        return layout.id
      },

      duplicateLayout: (layoutId) => {
        const state = get()
        const source = findLayout(state.layouts, layoutId)
        if (!source) return layoutId
        state.checkpoint()
        const now = Date.now()
        const clone: Layout = {
          ...source,
          id: uid(),
          name: `${source.name} copy`,
          items: source.items.map((i) => ({ ...i, id: uid() })),
          createdAt: now,
          updatedAt: now,
          isPreset: false,
        }
        persistLayout(clone)
        set((s) => ({ layouts: [...s.layouts, clone], activeLayoutIdByRoom: { ...s.activeLayoutIdByRoom, [clone.roomId]: clone.id } }))
        return clone.id
      },

      renameLayout: (layoutId, name) => {
        get().checkpoint()
        set((s) => ({ layouts: s.layouts.map((l) => (l.id === layoutId ? { ...l, name, updatedAt: Date.now() } : l)) }))
        const updated = findLayout(get().layouts, layoutId)
        if (updated) persistLayout(updated)
      },

      deleteLayout: (layoutId) => {
        const state = get()
        const layout = findLayout(state.layouts, layoutId)
        if (!layout) return
        state.checkpoint()
        void db.layouts.delete(layoutId)
        const remaining = state.layouts.filter((l) => l.id !== layoutId)
        const activeLayoutIdByRoom = { ...state.activeLayoutIdByRoom }
        if (activeLayoutIdByRoom[layout.roomId] === layoutId) {
          const next = remaining.find((l) => l.roomId === layout.roomId)
          if (next) activeLayoutIdByRoom[layout.roomId] = next.id
          else delete activeLayoutIdByRoom[layout.roomId]
        }
        set({ layouts: remaining, activeLayoutIdByRoom })
      },

      addItem: (roomId, entry, x, y) => {
        const state = get()
        state.checkpoint()
        const layoutId = state.ensureRoomLayout(roomId)
        const newItem: FurnitureItem = {
          id: uid(),
          libraryId: entry.id,
          category: entry.category,
          name: entry.name,
          w: entry.defaultW,
          d: entry.defaultD,
          x,
          y,
          rotation: 0,
          chaiseSide: entry.chaiseSide,
          source: entry.source,
          color: entry.color,
        }
        set((s) => ({
          layouts: s.layouts.map((l) => (l.id === layoutId ? { ...l, items: [...l.items, newItem], updatedAt: Date.now() } : l)),
          selectedItemId: newItem.id,
        }))
        const updated = findLayout(get().layouts, layoutId)
        if (updated) persistLayout(updated)
        return newItem.id
      },

      removeItem: (roomId, itemId) => {
        const state = get()
        state.checkpoint()
        const layoutId = state.activeLayoutIdByRoom[roomId]
        if (!layoutId) return
        set((s) => ({
          layouts: s.layouts.map((l) => (l.id === layoutId ? { ...l, items: l.items.filter((i) => i.id !== itemId), updatedAt: Date.now() } : l)),
          selectedItemId: s.selectedItemId === itemId ? null : s.selectedItemId,
        }))
        const updated = findLayout(get().layouts, layoutId)
        if (updated) persistLayout(updated)
      },

      beginDrag: () => get().checkpoint(),

      moveItemLive: (roomId, itemId, x, y) => {
        const layoutId = get().activeLayoutIdByRoom[roomId]
        if (!layoutId) return
        set((s) => ({
          layouts: s.layouts.map((l) => (l.id === layoutId ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, x, y } : i)) } : l)),
        }))
      },

      endDrag: (roomId) => {
        const layoutId = get().activeLayoutIdByRoom[roomId]
        if (!layoutId) return
        const layout = findLayout(get().layouts, layoutId)
        if (layout) persistLayout({ ...layout, updatedAt: Date.now() })
      },

      rotateItem: (roomId, itemId, rotation) => {
        const state = get()
        state.checkpoint()
        const layoutId = state.activeLayoutIdByRoom[roomId]
        if (!layoutId) return
        const normalized = ((rotation % 360) + 360) % 360
        set((s) => ({
          layouts: s.layouts.map((l) => (l.id === layoutId ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, rotation: normalized } : i)), updatedAt: Date.now() } : l)),
        }))
        const updated = findLayout(get().layouts, layoutId)
        if (updated) persistLayout(updated)
      },

      updateItem: (roomId, itemId, patch) => {
        const state = get()
        state.checkpoint()
        const layoutId = state.activeLayoutIdByRoom[roomId]
        if (!layoutId) return
        set((s) => ({
          layouts: s.layouts.map((l) => (l.id === layoutId ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)), updatedAt: Date.now() } : l)),
        }))
        const updated = findLayout(get().layouts, layoutId)
        if (updated) persistLayout(updated)
      },

      updateHouseSettings: (patch) => {
        set((s) => ({ houseSettings: { ...s.houseSettings, ...patch } }))
        void db.houseSettings.put({ id: 'singleton', ...get().houseSettings })
      },

      addCustomLibraryEntry: (entry) => {
        set((s) => ({ customLibrary: [...s.customLibrary, entry] }))
        void db.customLibrary.put(entry)
      },

      setCompare: (compare) => set({ compare }),

      exportJSON: () => {
        const s = get()
        return JSON.stringify({ layouts: s.layouts, houseSettings: s.houseSettings, customLibrary: s.customLibrary }, null, 2)
      },

      importJSON: async (json) => {
        const parsed = JSON.parse(json) as { layouts: Layout[]; houseSettings: HouseSettings; customLibrary: FurnitureLibraryEntry[] }
        get().checkpoint()
        await db.layouts.clear()
        await db.layouts.bulkPut(parsed.layouts)
        await db.houseSettings.put({ id: 'singleton', ...parsed.houseSettings })
        await db.customLibrary.clear()
        await db.customLibrary.bulkPut(parsed.customLibrary)
        const activeLayoutIdByRoom: Record<string, string> = {}
        for (const l of parsed.layouts) {
          if (!(l.roomId in activeLayoutIdByRoom)) activeLayoutIdByRoom[l.roomId] = l.id
        }
        set({ layouts: parsed.layouts, houseSettings: parsed.houseSettings, customLibrary: parsed.customLibrary, activeLayoutIdByRoom })
      },
    }),
    ['layouts'],
  ),
)

export function getActiveLayout(roomId: string): Layout | undefined {
  const state = useStore.getState()
  const layoutId = state.activeLayoutIdByRoom[roomId]
  return state.layouts.find((l) => l.id === layoutId)
}
