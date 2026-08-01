import { useMemo, useState } from 'react'
import { FURNITURE_LIBRARY } from '../../data/furnitureLibrary'
import { useStore } from '../../store/useStore'
import type { FurnitureCategory, FurnitureLibraryEntry, FurnitureSource } from '../../types'
import { CustomItemForm } from './CustomItemForm'

interface FurniturePaletteProps {
  roomId: string
  roomCenter: { x: number; y: number }
}

const CATEGORY_LABEL: Record<FurnitureCategory, string> = {
  sofa: 'Sofas',
  lsofa: 'L-shaped sofas',
  armchair: 'Armchairs',
  coffeeTable: 'Coffee tables',
  bed: 'Beds',
  wardrobe: 'Wardrobes',
  chest: 'Chests of drawers',
  desk: 'Desks',
  diningTable: 'Dining tables',
  tvUnit: 'TV units',
  whiteGood: 'White goods',
  custom: 'Custom',
}

const SOURCE_BADGE: Record<FurnitureSource, string> = {
  owned: 'bg-green-600/15 text-green-800 dark:text-green-300',
  considering: 'bg-amber-600/15 text-amber-800 dark:text-amber-300',
  generic: 'bg-black/5 dark:bg-white/10 text-current',
}

export function FurniturePalette({ roomId, roomCenter }: FurniturePaletteProps) {
  const [showCustomForm, setShowCustomForm] = useState(false)
  const customLibrary = useStore((s) => s.customLibrary)
  const addItem = useStore((s) => s.addItem)
  const addCustomLibraryEntry = useStore((s) => s.addCustomLibraryEntry)

  const allEntries = useMemo(() => [...FURNITURE_LIBRARY, ...customLibrary], [customLibrary])
  const grouped = useMemo(() => {
    const map = new Map<FurnitureCategory, FurnitureLibraryEntry[]>()
    for (const entry of allEntries) {
      const list = map.get(entry.category) ?? []
      list.push(entry)
      map.set(entry.category, list)
    }
    return map
  }, [allEntries])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Add furniture</h3>
        <button className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10" onClick={() => setShowCustomForm(true)}>
          + Custom item
        </button>
      </div>

      {showCustomForm && (
        <CustomItemForm
          onCancel={() => setShowCustomForm(false)}
          onCreate={(entry) => {
            addCustomLibraryEntry(entry)
            addItem(roomId, entry, roomCenter.x - entry.defaultW / 2, roomCenter.y - entry.defaultD / 2)
            setShowCustomForm(false)
          }}
        />
      )}

      <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
        {[...grouped.entries()].map(([category, entries]) => (
          <div key={category}>
            <div className="text-xs uppercase tracking-wide opacity-60 mb-1">{CATEGORY_LABEL[category]}</div>
            <div className="flex flex-wrap gap-1.5">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  className="text-xs px-2 py-1 rounded border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1"
                  onClick={() => addItem(roomId, entry, roomCenter.x - entry.defaultW / 2, roomCenter.y - entry.defaultD / 2)}
                  title={`${entry.defaultW} x ${entry.defaultD} cm`}
                >
                  {entry.name}
                  {entry.source !== 'generic' && <span className={`px-1 rounded ${SOURCE_BADGE[entry.source]}`}>{entry.source}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
