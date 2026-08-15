import { useState } from 'react'
import type { FurnitureCategory, FurnitureLibraryEntry, FurnitureSource } from '../../types'

interface CustomItemFormProps {
  onCreate: (entry: FurnitureLibraryEntry) => void
  onCancel: () => void
}

const CATEGORIES: FurnitureCategory[] = [
  'sofa',
  'lsofa',
  'armchair',
  'coffeeTable',
  'bed',
  'bedsideTable',
  'wardrobe',
  'chest',
  'desk',
  'diningTable',
  'tvUnit',
  'whiteGood',
  'custom',
]

export function CustomItemForm({ onCreate, onCancel }: CustomItemFormProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<FurnitureCategory>('custom')
  const [w, setW] = useState(100)
  const [d, setD] = useState(60)
  const [source, setSource] = useState<FurnitureSource>('considering')

  return (
    <form
      className="flex flex-col gap-2 p-3 rounded border border-black/10 bg-black/[0.02]"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim() || w <= 0 || d <= 0) return
        onCreate({ id: `custom-${Date.now()}`, category, name: name.trim(), defaultW: w, defaultD: d, source })
      }}
    >
      <label className="text-xs flex flex-col gap-1">
        Name
        <input className="border rounded px-2 py-1 text-sm bg-transparent" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ercol sofa" autoFocus />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs flex flex-col gap-1">
          Width (cm)
          <input type="number" min={1} className="border rounded px-2 py-1 text-sm bg-transparent" value={w} onChange={(e) => setW(Number(e.target.value))} />
        </label>
        <label className="text-xs flex flex-col gap-1">
          Depth (cm)
          <input type="number" min={1} className="border rounded px-2 py-1 text-sm bg-transparent" value={d} onChange={(e) => setD(Number(e.target.value))} />
        </label>
      </div>
      <label className="text-xs flex flex-col gap-1">
        Category
        <select className="border rounded px-2 py-1 text-sm bg-transparent" value={category} onChange={(e) => setCategory(e.target.value as FurnitureCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs flex flex-col gap-1">
        Source
        <select className="border rounded px-2 py-1 text-sm bg-transparent" value={source} onChange={(e) => setSource(e.target.value as FurnitureSource)}>
          <option value="owned">Owned</option>
          <option value="considering">Considering</option>
          <option value="generic">Generic</option>
        </select>
      </label>
      <div className="flex gap-2 justify-end mt-1">
        <button type="button" className="text-xs px-2 py-1 rounded bg-black/5" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
          Add to room
        </button>
      </div>
    </form>
  )
}
