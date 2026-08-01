import type { PointerEvent as ReactPointerEvent } from 'react'
import type { FurnitureItem } from '../../types'
import { FurnitureShapeBody } from './FurnitureShape'

interface FurnitureItemViewProps {
  item: FurnitureItem
  colliding?: boolean
  selected?: boolean
  interactive?: boolean
  onPointerDown?: (e: ReactPointerEvent<SVGGElement>, item: FurnitureItem) => void
}

const SOURCE_DOT: Record<string, string> = {
  owned: '#2f855a',
  considering: '#b7791f',
}

export function FurnitureItemView({ item, colliding = false, selected = false, interactive = true, onPointerDown }: FurnitureItemViewProps) {
  const dot = SOURCE_DOT[item.source]
  return (
    <g
      transform={`translate(${item.x} ${item.y}) rotate(${item.rotation} ${item.w / 2} ${item.d / 2})`}
      onPointerDown={interactive ? (e) => onPointerDown?.(e, item) : undefined}
      style={interactive ? { cursor: 'grab', touchAction: 'none' } : undefined}
      data-item-id={item.id}
    >
      <FurnitureShapeBody item={item} colliding={colliding} />
      {/* front-facing indicator */}
      <polygon points={`${item.w / 2 - 7},${item.d} ${item.w / 2 + 7},${item.d} ${item.w / 2},${item.d + 9}`} fill="#00000035" />
      {selected && <rect x={-3} y={-3} width={item.w + 6} height={item.d + 6} fill="none" stroke="#2b6cb0" strokeWidth={2} strokeDasharray="6 3" rx={4} />}
      {dot && <circle cx={item.w - 8} cy={8} r={5} fill={dot} stroke="white" strokeWidth={1} />}
    </g>
  )
}
