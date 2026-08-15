import { useMemo, useState } from 'react'
import { resolveOpenings } from '../../data/house'
import { downloadPng, downloadSvg, layoutSummaryText } from '../../lib/export'
import { polygonBounds } from '../../lib/geometry'
import { roomPolygon } from '../../lib/room'
import { useStore } from '../../store/useStore'
import type { FurnitureItem, RoomDef } from '../../types'
import { PlanDefs } from '../FloorPlan/PlanDefs'
import { RoomWalls } from '../FloorPlan/RoomWalls'
import { FurnitureItemView } from '../FloorPlan/FurnitureItemView'

interface ExportPanelProps {
  room: RoomDef
  layoutName: string
  items: FurnitureItem[]
  svg: SVGSVGElement | null
}

const PRINT_SCALE = 50 // 1:50

export function ExportPanel({ room, layoutName, items, svg }: ExportPanelProps) {
  const houseSettings = useStore((s) => s.houseSettings)
  const openings = useMemo(() => resolveOpenings(houseSettings.bedroom1WindowSide), [houseSettings.bedroom1WindowSide])
  const [printing, setPrinting] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const bounds = useMemo(() => polygonBounds(roomPolygon(room)), [room])
  const summaryText = useMemo(() => layoutSummaryText(room, layoutName, items), [room, layoutName, items])

  const handlePrint = () => {
    setPrinting(true)
    requestAnimationFrame(() => {
      window.print()
      setPrinting(false)
    })
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap gap-2">
        <button
          className="text-xs px-2 py-1 rounded bg-black/5 hover:bg-black/10 disabled:opacity-40"
          disabled={!svg}
          onClick={() => svg && downloadSvg(svg, `${room.name}-${layoutName}.svg`)}
        >
          Export SVG
        </button>
        <button
          className="text-xs px-2 py-1 rounded bg-black/5 hover:bg-black/10 disabled:opacity-40"
          disabled={!svg}
          onClick={() => svg && downloadPng(svg, `${room.name}-${layoutName}.png`)}
        >
          Export PNG
        </button>
        <button className="text-xs px-2 py-1 rounded bg-black/5 hover:bg-black/10" onClick={handlePrint}>
          Print (1:50, A4)
        </button>
        <button className="text-xs px-2 py-1 rounded bg-black/5 hover:bg-black/10" onClick={() => setSummaryOpen((v) => !v)}>
          {summaryOpen ? 'Hide' : 'Shopping'} summary
        </button>
      </div>

      {summaryOpen && (
        <textarea
          readOnly
          className="text-xs font-mono border rounded p-2 bg-transparent h-40"
          value={summaryText}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}

      {printing && (
        <div id="print-root">
          <svg
            width={`${(bounds.w / PRINT_SCALE).toFixed(2)}cm`}
            height={`${(bounds.h / PRINT_SCALE).toFixed(2)}cm`}
            viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
          >
            <PlanDefs />
            <rect x={bounds.x} y={bounds.y} width={bounds.w} height={bounds.h} fill="#f4ede1" />
            <RoomWalls room={room} floor={room.floor} openings={openings} showSwings />
            {items.map((item) => (
              <FurnitureItemView key={item.id} item={item} interactive={false} />
            ))}
          </svg>
        </div>
      )}
    </div>
  )
}
