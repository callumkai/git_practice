import { useMemo } from 'react'
import type { FloorId, OpeningDef, RoomDef } from '../../types'
import { computeDoorSwing } from '../../lib/doorSwing'
import { roomPolygon } from '../../lib/room'
import { edgeSegments, pointAtEdgeT } from '../../lib/wallLayout'

const WALL_THICKNESS = 12

interface RoomWallsProps {
  room: RoomDef
  floor: FloorId
  openings: OpeningDef[]
  showSwings?: boolean
  /** World-space wall runs (edge-relative not required) to highlight, e.g. from the TV helper. */
  highlightRuns?: { edgeIndex: number; start: number; end: number }[]
}

export function RoomWalls({ room, floor, openings, showSwings = false, highlightRuns = [] }: RoomWallsProps) {
  const poly = useMemo(() => roomPolygon(room), [room])
  const polyPath = useMemo(() => `M${poly.map((p) => `${p.x},${p.y}`).join(' L')} Z`, [poly])

  const swings = useMemo(() => {
    if (!showSwings) return []
    return openings.filter((o) => o.swingIntoRoomId === room.id).map((o) => ({ opening: o, swing: computeDoorSwing(o) })).filter((s) => s.swing !== null)
  }, [openings, room.id, showSwings])

  return (
    <g>
      {/* Floor */}
      <path d={polyPath} className="fill-floor" stroke="none" />
      <path d={polyPath} fill="url(#floorPlanks)" opacity={0.5} />

      {/* Walls + openings per edge */}
      {poly.map((a, i) => {
        const b = poly[(i + 1) % poly.length]!
        const segments = edgeSegments(a, b, floor, openings)
        return (
          <g key={i}>
            {segments.map((seg, j) => {
              const p1 = pointAtEdgeT(a, b, seg.start)
              const p2 = pointAtEdgeT(a, b, seg.end)
              if (seg.kind === 'wall') {
                return <line key={j} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--color-poche)" strokeWidth={WALL_THICKNESS} strokeLinecap="square" />
              }
              if (seg.kind === 'window') {
                return (
                  <g key={j}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--color-poche)" strokeWidth={WALL_THICKNESS} strokeLinecap="butt" opacity={0.3} />
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--color-window)" strokeWidth={5} strokeLinecap="butt" />
                  </g>
                )
              }
              if (seg.kind === 'fittedWardrobe') {
                return <line key={j} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#8a7a6a" strokeWidth={WALL_THICKNESS} strokeDasharray="10 4" strokeLinecap="butt" />
              }
              // door: gap in the wall + door leaf line
              return <line key={j} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--color-door)" strokeWidth={3} strokeLinecap="butt" opacity={0.5} />
            })}
          </g>
        )
      })}

      {/* TV helper: highlighted eligible wall runs */}
      {highlightRuns.map((r, i) => {
        const a = poly[r.edgeIndex]!
        const b = poly[(r.edgeIndex + 1) % poly.length]!
        const p1 = pointAtEdgeT(a, b, r.start)
        const p2 = pointAtEdgeT(a, b, r.end)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3fb27f" strokeWidth={WALL_THICKNESS + 4} strokeLinecap="butt" opacity={0.55} />
      })}

      {/* Door swing arcs (fitted wardrobe doors use the same geometry, coloured to match their wall hatch) */}
      {swings.map(({ opening, swing }) => {
        if (!swing) return null
        const color = opening.kind === 'fittedWardrobe' ? '#8a7a6a' : 'var(--color-door)'
        return (
          <g key={opening.id}>
            <path
              d={`M${swing.hinge.x},${swing.hinge.y} L${swing.closedEnd.x},${swing.closedEnd.y} A${swing.radius},${swing.radius} 0 0,${swing.sweepFlag} ${swing.openEnd.x},${swing.openEnd.y} Z`}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.7}
            />
            <line x1={swing.hinge.x} y1={swing.hinge.y} x2={swing.openEnd.x} y2={swing.openEnd.y} stroke={color} strokeWidth={2.5} opacity={0.85} />
          </g>
        )
      })}
    </g>
  )
}
