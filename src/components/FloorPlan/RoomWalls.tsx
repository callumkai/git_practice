import { useMemo } from 'react'
import type { FloorId, OpeningDef, RoomDef } from '../../types'
import { computeDoorSwing } from '../../lib/doorSwing'
import { computeFittedObstaclePolygon } from '../../lib/fittedObstacles'
import { roomPolygon } from '../../lib/room'
import { edgeSegments, pointAtEdgeT } from '../../lib/wallLayout'
import { formatCm } from '../../lib/format'

const WALL_THICKNESS = 12

interface RoomWallsProps {
  room: RoomDef
  floor: FloorId
  openings: OpeningDef[]
  showSwings?: boolean
  fittedWardrobeDepth?: number
  /** World-space wall runs (edge-relative not required) to highlight, e.g. from the TV helper. */
  highlightRuns?: { edgeIndex: number; start: number; end: number }[]
}

export function RoomWalls({ room, floor, openings, showSwings = false, fittedWardrobeDepth = 60, highlightRuns = [] }: RoomWallsProps) {
  const poly = useMemo(() => roomPolygon(room), [room])
  const polyPath = useMemo(() => `M${poly.map((p) => `${p.x},${p.y}`).join(' L')} Z`, [poly])

  const swings = useMemo(() => {
    if (!showSwings) return []
    return openings.filter((o) => o.swingIntoRoomId === room.id).map((o) => ({ opening: o, swing: computeDoorSwing(o) })).filter((s) => s.swing !== null)
  }, [openings, room.id, showSwings])

  const fittedObstacles = useMemo(
    () =>
      openings
        .filter((o) => o.kind === 'fittedWardrobe' && o.servesRoomId === room.id)
        .map((o) => ({ opening: o, polygon: computeFittedObstaclePolygon(o, fittedWardrobeDepth) }))
        .filter((o): o is { opening: OpeningDef; polygon: NonNullable<ReturnType<typeof computeFittedObstaclePolygon>> } => o.polygon !== null),
    [openings, room.id, fittedWardrobeDepth],
  )

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

      {/* Fitted wardrobe obstacles */}
      {fittedObstacles.map(({ opening, polygon }) => (
        <g key={opening.id}>
          <polygon points={polygon.map((p) => `${p.x},${p.y}`).join(' ')} fill="#8a7a6a55" stroke="#8a7a6a" strokeDasharray="6 3" />
          <text
            x={(polygon[0]!.x + polygon[2]!.x) / 2}
            y={(polygon[0]!.y + polygon[2]!.y) / 2}
            fontSize={11}
            textAnchor="middle"
            fill="#5c4b3a"
            paintOrder="stroke"
            stroke="var(--color-paper)"
            strokeWidth={3}
          >
            wardrobe (depth est. {formatCm(fittedWardrobeDepth)})
          </text>
        </g>
      ))}

      {/* Door swing arcs */}
      {swings.map(({ opening, swing }) => {
        if (!swing) return null
        return (
          <g key={opening.id}>
            <path
              d={`M${swing.hinge.x},${swing.hinge.y} L${swing.closedEnd.x},${swing.closedEnd.y} A${swing.radius},${swing.radius} 0 0,${swing.sweepFlag} ${swing.openEnd.x},${swing.openEnd.y} Z`}
              fill="none"
              stroke="var(--color-door)"
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.7}
            />
            <line x1={swing.hinge.x} y1={swing.hinge.y} x2={swing.openEnd.x} y2={swing.openEnd.y} stroke="var(--color-door)" strokeWidth={2.5} opacity={0.85} />
          </g>
        )
      })}
    </g>
  )
}
