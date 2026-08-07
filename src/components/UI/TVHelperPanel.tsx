import { useEffect, useMemo, useState } from 'react'
import { resolveOpenings } from '../../data/house'
import { formatCm } from '../../lib/format'
import { roomPolygon } from '../../lib/room'
import { comfortableViewingDistance, eligibleWallRuns, tvWallRunNeeded, tvWidthCm, viewingDistanceStatus } from '../../lib/tv'
import { edgeSegments, pointAtEdgeT } from '../../lib/wallLayout'
import { distance } from '../../lib/geometry'
import { itemFootprintPolygon } from '../../lib/furnitureShape'
import { useStore } from '../../store/useStore'
import type { FurnitureItem, RoomDef } from '../../types'

interface TVHelperPanelProps {
  room: RoomDef
  items: FurnitureItem[]
  onHighlightRunsChange: (runs: { edgeIndex: number; start: number; end: number }[]) => void
}

const COMMON_SIZES = [60, 65, 70, 75]

const STATUS_LABEL: Record<string, string> = {
  'too-close': 'A bit close',
  comfortable: 'Comfortable',
  'too-far': 'A bit far',
}

function itemCentroid(item: FurnitureItem) {
  const poly = itemFootprintPolygon(item)
  const sum = poly.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / poly.length, y: sum.y / poly.length }
}

export function TVHelperPanel({ room, items, onHighlightRunsChange }: TVHelperPanelProps) {
  const [inches, setInches] = useState(65)
  const [seatItemId, setSeatItemId] = useState<string>('')
  const bedroom1WindowSide = useStore((s) => s.houseSettings.bedroom1WindowSide)
  const openings = useMemo(() => resolveOpenings(bedroom1WindowSide), [bedroom1WindowSide])

  const poly = useMemo(() => roomPolygon(room), [room])
  const seatingItems = useMemo(() => items.filter((i) => i.category === 'sofa' || i.category === 'lsofa' || i.category === 'armchair'), [items])

  const eligibleRuns = useMemo(() => {
    const results: { edgeIndex: number; start: number; end: number; length: number; midpoint: { x: number; y: number } }[] = []
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]!
      const b = poly[(i + 1) % poly.length]!
      const segments = edgeSegments(a, b, room.floor, openings)
      const wallRuns = segments.filter((s) => s.kind === 'wall').map((s) => ({ start: s.start, end: s.end, length: s.end - s.start }))
      const eligible = eligibleWallRuns(wallRuns, inches)
      for (const run of eligible) {
        const midpoint = pointAtEdgeT(a, b, (run.start + run.end) / 2)
        results.push({ edgeIndex: i, start: run.start, end: run.end, length: run.length, midpoint })
      }
    }
    return results
  }, [poly, room.floor, inches, openings])

  useEffect(() => {
    onHighlightRunsChange(eligibleRuns.map((r) => ({ edgeIndex: r.edgeIndex, start: r.start, end: r.end })))
    return () => onHighlightRunsChange([])
  }, [eligibleRuns, onHighlightRunsChange])

  const seat = items.find((i) => i.id === seatItemId)
  const range = comfortableViewingDistance(inches)

  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="text-xs flex flex-col gap-1">
        Screen size

        <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
          {COMMON_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={`min-h-11 px-3 rounded text-sm ${inches === size ? 'bg-blue-600 text-white' : 'bg-black/5 hover:bg-black/10'}`}
              onClick={() => setInches(size)}
            >
              {size}"
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-h-11 min-w-11 rounded bg-black/5 hover:bg-black/10 text-base leading-none"
            onClick={() => setInches((v) => Math.max(32, v - 1))}
            aria-label="Smaller screen"
          >
            −
          </button>
          <input
            type="range"
            min={32}
            max={85}
            value={inches}
            onChange={(e) => setInches(Number(e.target.value))}
            className="flex-1"
          />
          <button
            type="button"
            className="min-h-11 min-w-11 rounded bg-black/5 hover:bg-black/10 text-base leading-none"
            onClick={() => setInches((v) => Math.min(85, v + 1))}
            aria-label="Larger screen"
          >
            +
          </button>
          <span className="w-12 text-right shrink-0">{inches}"</span>
        </div>
      </label>

      <div className="text-xs opacity-75">
        ~{formatCm(tvWidthCm(inches))} wide, needs ~{formatCm(tvWallRunNeeded(inches))} of clear wall.
      </div>

      <div className="text-xs">
        {eligibleRuns.length === 0 ? (
          <span className="text-red-700">No wall run in this room is long enough for a {inches}" TV.</span>
        ) : (
          <span>
            {eligibleRuns.length} wall run{eligibleRuns.length > 1 ? 's' : ''} highlighted on the plan can take it.
          </span>
        )}
      </div>

      {seatingItems.length > 0 && (
        <label className="text-xs flex flex-col gap-1">
          Viewing seat
          <select className="border rounded px-2 py-1 text-sm bg-transparent" value={seatItemId} onChange={(e) => setSeatItemId(e.target.value)}>
            <option value="">Choose a seat...</option>
            {seatingItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {seat && eligibleRuns.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-xs opacity-70">
            Comfortable range for {inches}": {formatCm(range.minCm)}–{formatCm(range.maxCm)}
          </div>
          <ul className="flex flex-col gap-1">
            {eligibleRuns.map((run, i) => {
              const d = distance(itemCentroid(seat), run.midpoint)
              const status = viewingDistanceStatus(d, inches)
              return (
                <li key={i} className={`text-xs px-2 py-1 rounded ${status === 'comfortable' ? 'bg-green-600/10' : 'bg-amber-600/10'}`}>
                  Wall run {i + 1}: {formatCm(d)} — {STATUS_LABEL[status]}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
