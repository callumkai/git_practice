import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'

interface LayoutManagerProps {
  roomId: string
  onCompare: (layoutIdA: string, layoutIdB: string) => void
}

export function LayoutManager({ roomId, onCompare }: LayoutManagerProps) {
  const allLayouts = useStore((s) => s.layouts)
  const layouts = useMemo(() => allLayouts.filter((l) => l.roomId === roomId), [allLayouts, roomId])
  const activeLayoutId = useStore((s) => s.activeLayoutIdByRoom[roomId])
  const switchActiveLayout = useStore((s) => s.switchActiveLayout)
  const createLayout = useStore((s) => s.createLayout)
  const duplicateLayout = useStore((s) => s.duplicateLayout)
  const renameLayout = useStore((s) => s.renameLayout)
  const deleteLayout = useStore((s) => s.deleteLayout)

  const [newName, setNewName] = useState('')
  const [compareTarget, setCompareTarget] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {layouts.map((layout) => (
          <li
            key={layout.id}
            className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${layout.id === activeLayoutId ? 'bg-blue-600/10 font-medium' : 'hover:bg-black/5'}`}
          >
            {editingId === layout.id ? (
              <input
                autoFocus
                className="flex-1 border rounded px-1 py-0.5 bg-transparent"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => {
                  if (editingName.trim()) renameLayout(layout.id, editingName.trim())
                  setEditingId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
              />
            ) : (
              <button className="flex-1 text-left truncate" onClick={() => switchActiveLayout(roomId, layout.id)}>
                {layout.name}
                {layout.isPreset && <span className="ml-1 opacity-50">(preset)</span>}
              </button>
            )}
            <button
              className="opacity-60 hover:opacity-100"
              title="Rename"
              onClick={() => {
                setEditingId(layout.id)
                setEditingName(layout.name)
              }}
            >
              ✎
            </button>
            <button className="opacity-60 hover:opacity-100" title="Duplicate" onClick={() => duplicateLayout(layout.id)}>
              ⧉
            </button>
            {layouts.length > 1 && (
              <button className="opacity-60 hover:opacity-100 text-red-600" title="Delete" onClick={() => deleteLayout(layout.id)}>
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          createLayout(roomId, newName.trim())
          setNewName('')
        }}
      >
        <input
          className="flex-1 text-xs border rounded px-2 py-1 bg-transparent"
          placeholder="New layout name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
          Add
        </button>
      </form>

      {layouts.length > 1 && (
        <div className="flex gap-1 items-center pt-1 border-t border-black/10 mt-1">
          <select className="flex-1 text-xs border rounded px-2 py-1 bg-transparent" value={compareTarget} onChange={(e) => setCompareTarget(e.target.value)}>
            <option value="">Compare with...</option>
            {layouts
              .filter((l) => l.id !== activeLayoutId)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
          </select>
          <button
            className="text-xs px-2 py-1 rounded bg-black/5 disabled:opacity-40"
            disabled={!compareTarget || !activeLayoutId}
            onClick={() => activeLayoutId && compareTarget && onCompare(activeLayoutId, compareTarget)}
          >
            Compare
          </button>
        </div>
      )}
    </div>
  )
}
