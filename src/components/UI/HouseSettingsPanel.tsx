import { useMemo } from 'react'
import { findAccessWarnings } from '../../lib/houseAccess'
import { useStore } from '../../store/useStore'
import type { FurnitureItem } from '../../types'

interface HouseSettingsPanelProps {
  currentRoomItems: FurnitureItem[]
}

export function HouseSettingsPanel({ currentRoomItems }: HouseSettingsPanelProps) {
  const settings = useStore((s) => s.houseSettings)
  const updateHouseSettings = useStore((s) => s.updateHouseSettings)

  const warnings = useMemo(() => findAccessWarnings(currentRoomItems, settings), [currentRoomItems, settings])

  return (
    <div className="flex flex-col gap-3 text-xs">
      <p className="opacity-70">These figures were never surveyed. Estimates are marked on the plan — enter real measurements here once you have them.</p>

      <label className="flex flex-col gap-1">
        Bedroom 1 window position
        <select
          className="border rounded px-2 py-1 bg-transparent"
          value={settings.bedroom1WindowSide}
          onChange={(e) => updateHouseSettings({ bedroom1WindowSide: e.target.value as 'left' | 'right' })}
        >
          <option value="right">80cm from the right (sketch)</option>
          <option value="left">80cm from the left (typed note)</option>
        </select>
      </label>

      <p className="opacity-70">
        Living room window: assumed centred in its 270cm run (marked "est." on the plan) — no alternative position was noted, so there's nothing to toggle
        here yet.
      </p>

      <p className="opacity-70">
        Bedroom 1's fitted wardrobe is built into the wall, so it doesn't take up floor depth — only its two doors swinging open do, and those are sized
        from the surveyed 136cm width, not a guess.
      </p>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/10">
        <label className="flex flex-col gap-1">
          Front door width
          <input
            type="number"
            placeholder="not measured"
            className="border rounded px-2 py-1 bg-transparent"
            value={settings.frontDoorWidth ?? ''}
            onChange={(e) => updateHouseSettings({ frontDoorWidth: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
        <label className="flex flex-col gap-1">
          Narrowest hall width
          <input
            type="number"
            placeholder="not measured"
            className="border rounded px-2 py-1 bg-transparent"
            value={settings.narrowestHallWidth ?? ''}
            onChange={(e) => updateHouseSettings({ narrowestHallWidth: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          Stair turn clearance
          <input
            type="number"
            placeholder="not measured"
            className="border rounded px-2 py-1 bg-transparent"
            value={settings.stairTurnClearance ?? ''}
            onChange={(e) => updateHouseSettings({ stairTurnClearance: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
      </div>

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1">
          {warnings.map((w, i) => (
            <li key={i} className="px-2 py-1 rounded bg-red-600/10 text-red-700">
              ⚠ {w.detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
