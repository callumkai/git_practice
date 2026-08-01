import { useCallback, useState } from 'react'
import { roomById } from '../data/house'
import { useStore } from '../store/useStore'
import { RoomCanvas } from './FloorPlan/RoomCanvas'
import { FurniturePalette } from './UI/FurniturePalette'
import { LayoutManager } from './UI/LayoutManager'
import { ClearancePanel } from './UI/ClearancePanel'
import { TVHelperPanel } from './UI/TVHelperPanel'
import { HouseSettingsPanel } from './UI/HouseSettingsPanel'
import { ExportPanel } from './UI/ExportPanel'
import { CompareView } from './UI/CompareView'

interface RoomViewProps {
  roomId: string
  onBack: () => void
}

type Tab = 'furniture' | 'layouts' | 'clearance' | 'tv' | 'house' | 'export'

const TABS: { id: Tab; label: string }[] = [
  { id: 'furniture', label: 'Furniture' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'clearance', label: 'Clearance' },
  { id: 'tv', label: 'TV' },
  { id: 'house', label: 'House info' },
  { id: 'export', label: 'Export' },
]

export function RoomView({ roomId, onBack }: RoomViewProps) {
  const room = roomById(roomId)
  const [tab, setTab] = useState<Tab>('furniture')
  const [highlightRuns, setHighlightRuns] = useState<{ edgeIndex: number; start: number; end: number }[]>([])
  const [svg, setSvg] = useState<SVGSVGElement | null>(null)
  const [compare, setCompare] = useState<{ a: string; b: string } | null>(null)

  const snapEnabled = useStore((s) => s.snapEnabled)
  const setSnapEnabled = useStore((s) => s.setSnapEnabled)
  const showDimensions = useStore((s) => s.showDimensions)
  const setShowDimensions = useStore((s) => s.setShowDimensions)
  const canUndo = useStore((s) => s.canUndo)
  const canRedo = useStore((s) => s.canRedo)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const layouts = useStore((s) => s.layouts)
  const activeLayoutIdByRoom = useStore((s) => s.activeLayoutIdByRoom)

  const onHighlightRunsChange = useCallback((runs: typeof highlightRuns) => setHighlightRuns(runs), [])

  if (!room) return null

  const layoutId = activeLayoutIdByRoom[room.id]
  const layout = layouts.find((l) => l.id === layoutId)
  const items = layout?.items ?? []
  const roomCenter = { x: room.rect.x + room.rect.w / 2, y: room.rect.y + room.rect.h / 2 }

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full">
      <div className="flex-1 flex flex-col gap-2 min-h-[50vh]">
        <div className="flex items-center gap-2 px-1">
          <button className="text-sm px-2 py-1 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10" onClick={onBack}>
            ← Floor
          </button>
          <h2 className="font-medium">{room.name}</h2>
          <span className="text-xs opacity-60 truncate">{layout?.name}</span>
          <div className="ml-auto flex items-center gap-1">
            <button className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 disabled:opacity-30" disabled={!canUndo} onClick={undo}>
              ↶ Undo
            </button>
            <button className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 disabled:opacity-30" disabled={!canRedo} onClick={redo}>
              ↷ Redo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-1 text-xs">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} /> Snap
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showDimensions} onChange={(e) => setShowDimensions(e.target.checked)} /> Dimensions
          </label>
        </div>

        <div className="flex-1 min-h-0">
          <RoomCanvas key={room.id} room={room} highlightRuns={tab === 'tv' ? highlightRuns : []} onSvgReady={setSvg} />
        </div>
      </div>

      <div className="lg:w-80 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1 border-b border-black/10 dark:border-white/10 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`text-xs px-2 py-1 rounded ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {tab === 'furniture' && <FurniturePalette roomId={room.id} roomCenter={roomCenter} />}
          {tab === 'layouts' && <LayoutManager roomId={room.id} onCompare={(a, b) => setCompare({ a, b })} />}
          {tab === 'clearance' && <ClearancePanel room={room} />}
          {tab === 'tv' && <TVHelperPanel room={room} items={items} onHighlightRunsChange={onHighlightRunsChange} />}
          {tab === 'house' && <HouseSettingsPanel currentRoomItems={items} />}
          {tab === 'export' && <ExportPanel room={room} layoutName={layout?.name ?? 'Layout'} items={items} svg={svg} />}
        </div>
      </div>

      {compare && <CompareView room={room} layoutIdA={compare.a} layoutIdB={compare.b} onClose={() => setCompare(null)} />}
    </div>
  )
}
