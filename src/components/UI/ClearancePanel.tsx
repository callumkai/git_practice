import { useMemo } from 'react'
import { resolveOpenings } from '../../data/house'
import { runClearanceChecks } from '../../lib/clearance'
import { useStore } from '../../store/useStore'
import type { RoomDef } from '../../types'

interface ClearancePanelProps {
  room: RoomDef
}

export function ClearancePanel({ room }: ClearancePanelProps) {
  const layouts = useStore((s) => s.layouts)
  const activeLayoutIdByRoom = useStore((s) => s.activeLayoutIdByRoom)
  const houseSettings = useStore((s) => s.houseSettings)
  const layoutId = activeLayoutIdByRoom[room.id]
  const layout = layouts.find((l) => l.id === layoutId)
  const items = useMemo(() => layout?.items ?? [], [layout])
  const openings = useMemo(() => resolveOpenings(houseSettings.bedroom1WindowSide), [houseSettings.bedroom1WindowSide])

  const results = useMemo(() => runClearanceChecks(room, items, openings, houseSettings), [room, items, openings, houseSettings])

  if (results.length === 0) {
    return <p className="text-xs opacity-60">Add furniture to see clearance checks.</p>
  }

  const passCount = results.filter((r) => r.pass).length

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs opacity-70">
        {passCount} of {results.length} checks pass
      </div>
      <ul className="flex flex-col gap-1.5">
        {results.map((r) => (
          <li key={r.ruleId} className={`text-xs px-2 py-1.5 rounded flex flex-col gap-0.5 ${r.pass ? 'bg-green-600/10' : 'bg-red-600/10'}`}>
            <div className="flex items-center gap-1.5 font-medium">
              <span aria-hidden>{r.pass ? '✓' : '✕'}</span>
              {r.label}
            </div>
            <div className="opacity-75">{r.detail}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
