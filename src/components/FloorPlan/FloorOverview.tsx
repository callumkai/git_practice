import { useMemo, useRef } from 'react'
import { resolveOpenings, roomsForFloor } from '../../data/house'
import { polygonBounds } from '../../lib/geometry'
import { roomPolygon } from '../../lib/room'
import { useStore } from '../../store/useStore'
import type { FloorId } from '../../types'
import { usePanZoom } from '../../hooks/usePanZoom'
import { PlanDefs } from './PlanDefs'
import { RoomWalls } from './RoomWalls'
import { FurnitureItemView } from './FurnitureItemView'

interface FloorOverviewProps {
  floor: FloorId
  onSelectRoom: (roomId: string) => void
}

export function FloorOverview({ floor, onSelectRoom }: FloorOverviewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const rooms = useMemo(() => roomsForFloor(floor), [floor])
  const layouts = useStore((s) => s.layouts)
  const activeLayoutIdByRoom = useStore((s) => s.activeLayoutIdByRoom)
  const houseSettings = useStore((s) => s.houseSettings)
  const openings = useMemo(() => resolveOpenings(houseSettings.bedroom1WindowSide), [houseSettings.bedroom1WindowSide])

  const bounds = useMemo(() => {
    const all = rooms.flatMap((r) => roomPolygon(r))
    return polygonBounds(all)
  }, [rooms])

  const padding = 60
  const initialViewBox = useMemo(
    () => ({ x: bounds.x - padding, y: bounds.y - padding, w: bounds.w + padding * 2, h: bounds.h + padding * 2 }),
    [bounds],
  )
  const { viewBoxAttr, handlers, resetView } = usePanZoom(initialViewBox, svgRef)

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex justify-end px-1">
        <button className="px-2 py-1 text-sm rounded bg-black/5 dark:bg-white/10 hover:bg-black/10" onClick={resetView}>
          Reset view
        </button>
      </div>
      <svg
        ref={svgRef}
        viewBox={viewBoxAttr}
        className="flex-1 w-full min-h-[400px] rounded-lg bg-paper touch-none select-none"
        {...handlers}
      >
        <PlanDefs />
        {rooms.map((room) => {
          const layoutId = activeLayoutIdByRoom[room.id]
          const layout = layouts.find((l) => l.id === layoutId)
          const items = layout?.items ?? []
          const b = polygonBounds(roomPolygon(room))
          return (
            <g key={room.id} onClick={() => onSelectRoom(room.id)} className="cursor-pointer">
              <RoomWalls room={room} floor={floor} openings={openings} fittedWardrobeDepth={houseSettings.fittedWardrobeDepth} />
              {items.map((item) => (
                <FurnitureItemView key={item.id} item={item} interactive={false} />
              ))}
              <text
                x={b.x + b.w / 2}
                y={b.y + b.h / 2}
                textAnchor="middle"
                fontSize={Math.min(20, b.w / 8)}
                fill="#3a342b"
                paintOrder="stroke"
                stroke="var(--color-paper)"
                strokeWidth={4}
                opacity={0.85}
              >
                {room.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
