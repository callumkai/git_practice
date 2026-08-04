import { useMemo } from 'react'
import { resolveOpenings } from '../../data/house'
import { polygonBounds } from '../../lib/geometry'
import { roomPolygon } from '../../lib/room'
import { useStore } from '../../store/useStore'
import type { RoomDef } from '../../types'
import { PlanDefs } from '../FloorPlan/PlanDefs'
import { RoomWalls } from '../FloorPlan/RoomWalls'
import { FurnitureItemView } from '../FloorPlan/FurnitureItemView'

interface CompareViewProps {
  room: RoomDef
  layoutIdA: string
  layoutIdB: string
  onClose: () => void
}

function MiniPlan({ room, layoutId }: { room: RoomDef; layoutId: string }) {
  const layout = useStore((s) => s.layouts.find((l) => l.id === layoutId))
  const houseSettings = useStore((s) => s.houseSettings)
  const openings = useMemo(() => resolveOpenings(houseSettings.bedroom1WindowSide), [houseSettings.bedroom1WindowSide])
  const bounds = useMemo(() => polygonBounds(roomPolygon(room)), [room])
  const padding = 40
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.w + padding * 2} ${bounds.h + padding * 2}`

  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className="text-sm font-medium truncate">{layout?.name ?? 'Layout'}</div>
      <svg viewBox={viewBox} className="w-full aspect-square rounded-lg bg-paper">
        <PlanDefs />
        <RoomWalls room={room} floor={room.floor} openings={openings} fittedWardrobeDepth={houseSettings.fittedWardrobeDepth} />
        {(layout?.items ?? []).map((item) => (
          <FurnitureItemView key={item.id} item={item} interactive={false} />
        ))}
      </svg>
    </div>
  )
}

export function CompareView({ room, layoutIdA, layoutIdB, onClose }: CompareViewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium">Compare layouts — {room.name}</h2>
          <button className="text-sm px-2 py-1 rounded bg-black/5" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="flex gap-4 flex-col sm:flex-row">
          <MiniPlan room={room} layoutId={layoutIdA} />
          <MiniPlan room={room} layoutId={layoutIdB} />
        </div>
      </div>
    </div>
  )
}
