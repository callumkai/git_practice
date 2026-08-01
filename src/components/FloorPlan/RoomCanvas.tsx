import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useStore } from '../../store/useStore'
import { resolveOpenings } from '../../data/house'
import type { FurnitureItem, RoomDef } from '../../types'
import { PlanDefs } from './PlanDefs'
import { RoomWalls } from './RoomWalls'
import { DimensionLines } from './DimensionLines'
import { FurnitureItemView } from './FurnitureItemView'
import { usePanZoom } from '../../hooks/usePanZoom'
import { screenToSvgPoint } from '../../lib/svgCoords'
import { checkRoomCollisions } from '../../lib/collision'
import { computeSnapDelta, distancesToRoomWalls, type WallDistance } from '../../lib/snapping'
import { polygonBounds } from '../../lib/geometry'
import { roomPolygon } from '../../lib/room'
import { formatCm } from '../../lib/format'

interface RoomCanvasProps {
  room: RoomDef
  highlightRuns?: { edgeIndex: number; start: number; end: number }[]
  onSvgReady?: (svg: SVGSVGElement | null) => void
}

const WALL_LABELS = ['N wall', 'E wall', 'S wall', 'W wall']

export function RoomCanvas({ room, highlightRuns = [], onSvgReady }: RoomCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onSvgReady?.(svgRef.current)
    return () => onSvgReady?.(null)
  }, [onSvgReady])

  const showDimensions = useStore((s) => s.showDimensions)
  const snapEnabled = useStore((s) => s.snapEnabled)
  const selectedItemId = useStore((s) => s.selectedItemId)
  const houseSettings = useStore((s) => s.houseSettings)
  const openings = useMemo(() => resolveOpenings(houseSettings.bedroom1WindowSide), [houseSettings.bedroom1WindowSide])
  const activeLayoutIdByRoom = useStore((s) => s.activeLayoutIdByRoom)
  const layouts = useStore((s) => s.layouts)
  const ensureRoomLayout = useStore((s) => s.ensureRoomLayout)
  const selectItem = useStore((s) => s.selectItem)
  const beginDrag = useStore((s) => s.beginDrag)
  const moveItemLive = useStore((s) => s.moveItemLive)
  const endDrag = useStore((s) => s.endDrag)
  const removeItem = useStore((s) => s.removeItem)
  const rotateItem = useStore((s) => s.rotateItem)

  useEffect(() => {
    ensureRoomLayout(room.id)
  }, [room.id, ensureRoomLayout])

  const layoutId = activeLayoutIdByRoom[room.id]
  const layout = layouts.find((l) => l.id === layoutId)
  const items = useMemo(() => layout?.items ?? [], [layout])

  const bounds = useMemo(() => polygonBounds(roomPolygon(room)), [room])
  const padding = Math.max(60, Math.min(bounds.w, bounds.h) * 0.2)
  const initialViewBox = useMemo(
    () => ({ x: bounds.x - padding, y: bounds.y - padding, w: bounds.w + padding * 2, h: bounds.h + padding * 2 }),
    [bounds, padding],
  )
  const { viewBoxAttr, handlers, resetView } = usePanZoom(initialViewBox, svgRef)

  const collisions = useMemo(() => checkRoomCollisions(items, room, openings, houseSettings), [items, room, openings, houseSettings])
  const collisionMap = useMemo(() => new Map(collisions.map((c) => [c.itemId, c])), [collisions])

  const [dragState, setDragState] = useState<{ itemId: string; offsetX: number; offsetY: number } | null>(null)
  const [liveDistances, setLiveDistances] = useState<WallDistance[] | null>(null)

  const onItemPointerDown = useCallback(
    (e: ReactPointerEvent<SVGGElement>, item: FurnitureItem) => {
      e.stopPropagation()
      const svg = svgRef.current
      if (!svg) return
      const pt = screenToSvgPoint(svg, e.clientX, e.clientY)
      beginDrag()
      selectItem(item.id)
      setDragState({ itemId: item.id, offsetX: pt.x - item.x, offsetY: pt.y - item.y })
      try {
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      } catch {
        /* not all targets support pointer capture */
      }
    },
    [beginDrag, selectItem],
  )

  const onSvgPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (dragState) {
        const svg = svgRef.current
        if (!svg) return
        const pt = screenToSvgPoint(svg, e.clientX, e.clientY)
        let x = pt.x - dragState.offsetX
        let y = pt.y - dragState.offsetY
        const current = items.find((i) => i.id === dragState.itemId)
        if (current) {
          let candidate = { ...current, x, y }
          if (snapEnabled) {
            const others = items.filter((i) => i.id !== dragState.itemId)
            const snap = computeSnapDelta(candidate, room, others)
            x += snap.dx
            y += snap.dy
            candidate = { ...candidate, x, y }
          }
          moveItemLive(room.id, dragState.itemId, x, y)
          setLiveDistances(distancesToRoomWalls(candidate, room))
        }
        return
      }
      handlers.onPointerMove(e)
    },
    [dragState, items, snapEnabled, room, moveItemLive, handlers],
  )

  const onSvgPointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (dragState) {
        endDrag(room.id)
        setDragState(null)
        setLiveDistances(null)
        return
      }
      handlers.onPointerUp(e)
    },
    [dragState, endDrag, room.id, handlers],
  )

  useEffect(() => {
    if (!selectedItemId) return
    const item = items.find((i) => i.id === selectedItemId)
    if (!item) return

    function onKeyDown(e: KeyboardEvent) {
      const step = e.shiftKey ? 10 : 1
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft') dx = -step
      else if (e.key === 'ArrowRight') dx = step
      else if (e.key === 'ArrowUp') dy = -step
      else if (e.key === 'ArrowDown') dy = step
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeItem(room.id, selectedItemId!)
        return
      } else return
      e.preventDefault()
      const it = items.find((i) => i.id === selectedItemId)
      if (!it) return
      beginDrag()
      moveItemLive(room.id, selectedItemId!, it.x + dx, it.y + dy)
      endDrag(room.id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedItemId, items, room.id, removeItem, moveItemLive, beginDrag, endDrag])

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <button
          className="min-h-11 px-3 py-2 text-sm rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 disabled:opacity-40"
          onClick={() => selectedItem && rotateItem(room.id, selectedItem.id, selectedItem.rotation - 15)}
          disabled={!selectedItem}
        >
          ⟲ 15°
        </button>
        <button
          className="min-h-11 px-3 py-2 text-sm rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 disabled:opacity-40"
          onClick={() => selectedItem && rotateItem(room.id, selectedItem.id, selectedItem.rotation + 15)}
          disabled={!selectedItem}
        >
          15° ⟳
        </button>
        <button
          className="min-h-11 px-3 py-2 text-sm rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 disabled:opacity-40"
          onClick={() => selectedItem && rotateItem(room.id, selectedItem.id, Math.round(selectedItem.rotation / 90) * 90)}
          disabled={!selectedItem}
        >
          Snap 90°
        </button>
        <button
          className="min-h-11 px-3 py-2 text-sm rounded bg-red-600/10 text-red-700 dark:text-red-300 hover:bg-red-600/20 disabled:opacity-40"
          onClick={() => selectedItem && removeItem(room.id, selectedItem.id)}
          disabled={!selectedItem}
        >
          Delete
        </button>
        <button className="ml-auto min-h-11 px-3 py-2 text-sm rounded bg-black/5 dark:bg-white/10 hover:bg-black/10" onClick={resetView}>
          Reset view
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={viewBoxAttr}
        className="flex-1 w-full min-h-[200px] lg:min-h-[320px] rounded-lg bg-paper touch-none select-none"
        onPointerDown={handlers.onPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
        onPointerCancel={onSvgPointerUp}
        onClick={(e) => {
          if (e.target === svgRef.current) selectItem(null)
        }}
      >
        <PlanDefs />
        <RoomWalls
          room={room}
          floor={room.floor}
          openings={openings}
          showSwings
          fittedWardrobeDepth={houseSettings.fittedWardrobeDepth}
          highlightRuns={highlightRuns}
        />
        {showDimensions && <DimensionLines room={room} floor={room.floor} openings={openings} />}

        {items.map((item) => {
          const collision = collisionMap.get(item.id)
          return (
            <g key={item.id}>
              <FurnitureItemView item={item} colliding={collision?.colliding} selected={item.id === selectedItemId} onPointerDown={onItemPointerDown} />
              {collision?.colliding && (
                <text
                  x={item.x + item.w / 2}
                  y={item.y + item.d + 22}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#b02a2a"
                  paintOrder="stroke"
                  stroke="var(--color-paper)"
                  strokeWidth={3}
                >
                  {collision.reasons.join(' · ')}
                </text>
              )}
            </g>
          )
        })}

        {dragState && liveDistances && (
          <g pointerEvents="none">
            {liveDistances.map((d) => (
              <text
                key={d.edgeIndex}
                x={bounds.x + bounds.w / 2}
                y={bounds.y - padding * 0.5 + d.edgeIndex * 14}
                fontSize={11}
                textAnchor="middle"
                fill="#2b6cb0"
                paintOrder="stroke"
                stroke="var(--color-paper)"
                strokeWidth={3}
              >
                {WALL_LABELS[d.edgeIndex] ?? `wall ${d.edgeIndex}`}: {formatCm(d.distance)}
              </text>
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}
