import { useMemo } from 'react'
import type { FloorId, OpeningDef, RoomDef } from '../../types'
import { roomDimensionLines } from '../../lib/dimensionLayout'

interface DimensionLinesProps {
  room: RoomDef
  floor: FloorId
  openings: OpeningDef[]
}

function TickLine({ a, b, label, estimated }: { a: { x: number; y: number }; b: { x: number; y: number }; label: string; estimated: boolean }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * 4
  const ny = (dx / len) * 4
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  return (
    <g className="text-[11px]">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#5c5346" strokeWidth={1} opacity={0.8} />
      <line x1={a.x - nx} y1={a.y - ny} x2={a.x + nx} y2={a.y + ny} stroke="#5c5346" strokeWidth={1} opacity={0.8} />
      <line x1={b.x - nx} y1={b.y - ny} x2={b.x + nx} y2={b.y + ny} stroke="#5c5346" strokeWidth={1} opacity={0.8} />
      <text
        x={mid.x}
        y={mid.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fill={estimated ? '#a25b1f' : '#3a342b'}
        paintOrder="stroke"
        stroke="var(--color-paper)"
        strokeWidth={3}
        fontStyle={estimated ? 'italic' : 'normal'}
      >
        {label}
        {estimated ? ' (est.)' : ''}
      </text>
    </g>
  )
}

export function DimensionLines({ room, floor, openings }: DimensionLinesProps) {
  const { wallLines, openingLines } = useMemo(() => roomDimensionLines(room, floor, openings), [room, floor, openings])

  return (
    <g>
      {wallLines.map((l) => (
        <TickLine key={l.id} a={l.a} b={l.b} label={l.label} estimated={false} />
      ))}
      {openingLines.map((l) => (
        <TickLine key={l.id} a={l.a} b={l.b} label={l.label} estimated={l.estimated} />
      ))}
    </g>
  )
}
