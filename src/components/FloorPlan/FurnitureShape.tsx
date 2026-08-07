import type { FurnitureItem } from '../../types'

const UPHOLSTERY = {
  sofa: '#8a9a8b',
  lsofa: '#8a9a8b',
  armchair: '#b08968',
} as const

interface ShapeProps {
  item: FurnitureItem
  colliding?: boolean
}

function SofaShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const armWidth = Math.min(14, w * 0.12)
  const backDepth = Math.min(18, d * 0.28)
  const fill = colliding ? '#c0605a' : UPHOLSTERY.sofa
  const seatX0 = armWidth
  const seatX1 = w - armWidth
  const seatWidth = Math.max(seatX1 - seatX0, 0)
  const cushionCount = Math.max(1, Math.round(seatWidth / 70))
  const cushionW = seatWidth / cushionCount

  return (
    <g>
      <rect x={0} y={0} width={w} height={d} rx={6} fill={fill} stroke="#00000030" strokeWidth={1} />
      {/* back cushion strip */}
      <rect x={armWidth} y={0} width={Math.max(w - armWidth * 2, 0)} height={backDepth} fill="#00000018" rx={3} />
      {/* arms */}
      <rect x={0} y={0} width={armWidth} height={d} fill="#00000022" rx={4} />
      <rect x={w - armWidth} y={0} width={armWidth} height={d} fill="#00000022" rx={4} />
      {/* seat cushion dividers */}
      {Array.from({ length: cushionCount - 1 }, (_, i) => (
        <line key={i} x1={seatX0 + cushionW * (i + 1)} y1={backDepth} x2={seatX0 + cushionW * (i + 1)} y2={d - 4} stroke="#00000025" strokeWidth={1.5} />
      ))}
      <rect x={seatX0} y={backDepth} width={seatWidth} height={Math.max(d - backDepth - 4, 0)} fill="none" stroke="#00000018" strokeWidth={1} rx={3} />
    </g>
  )
}

function LSofaShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const chaiseSide = item.chaiseSide ?? 'right'
  const armDepth = Math.min(90, d)
  const chaiseWidth = Math.min(armDepth, w)
  const fill = colliding ? '#c0605a' : UPHOLSTERY.lsofa
  const backDepth = Math.min(16, armDepth * 0.3)

  const path =
    chaiseSide === 'right'
      ? `M0,0 L${w},0 L${w},${d} L${w - chaiseWidth},${d} L${w - chaiseWidth},${armDepth} L0,${armDepth} Z`
      : `M0,0 L${w},0 L${w},${armDepth} L${chaiseWidth},${armDepth} L${chaiseWidth},${d} L0,${d} Z`

  const runWidth = Math.max(w - chaiseWidth, 0)
  const runX = chaiseSide === 'right' ? 0 : chaiseWidth
  const chaiseX = chaiseSide === 'right' ? w - chaiseWidth : 0
  const armX = chaiseSide === 'right' ? 0 : w - Math.min(14, runWidth * 0.15)
  const armWidth = Math.min(14, runWidth * 0.15)

  const seatWidth = Math.max(runWidth - armWidth, 0)
  const seatX0 = chaiseSide === 'right' ? armX + armWidth : runX
  const cushionCount = Math.max(1, Math.round(seatWidth / 70))
  const cushionW = seatWidth / cushionCount

  return (
    <g>
      <path d={path} fill={fill} stroke="#00000030" strokeWidth={1} />
      {/* back cushion strip along the whole back edge */}
      <rect x={0} y={0} width={w} height={backDepth} fill="#00000018" rx={3} />
      {/* outer arm at the far end of the straight run */}
      <rect x={armX} y={0} width={armWidth} height={armDepth} fill="#00000022" rx={4} />
      {/* seat cushion dividers along the run */}
      {Array.from({ length: cushionCount - 1 }, (_, i) => (
        <line
          key={i}
          x1={seatX0 + cushionW * (i + 1)}
          y1={backDepth}
          x2={seatX0 + cushionW * (i + 1)}
          y2={armDepth - 3}
          stroke="#00000025"
          strokeWidth={1.5}
        />
      ))}
      <rect x={seatX0} y={backDepth} width={seatWidth} height={Math.max(armDepth - backDepth - 3, 0)} fill="none" stroke="#00000018" strokeWidth={1} rx={3} />
      {/* chaise seat cushion */}
      <rect
        x={chaiseX + 3}
        y={armDepth}
        width={Math.max(chaiseWidth - 6, 0)}
        height={Math.max(d - armDepth - 4, 0)}
        fill="none"
        stroke="#00000018"
        strokeWidth={1}
        rx={3}
      />
    </g>
  )
}

function ArmchairShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const armWidth = Math.min(14, w * 0.16)
  const backDepth = Math.min(18, d * 0.28)
  const fill = colliding ? '#c0605a' : UPHOLSTERY.armchair
  return (
    <g>
      <rect x={0} y={0} width={w} height={d} rx={8} fill={fill} stroke="#00000030" strokeWidth={1} />
      <rect x={armWidth} y={0} width={Math.max(w - armWidth * 2, 0)} height={backDepth} fill="#00000018" rx={3} />
      <rect x={0} y={0} width={armWidth} height={d} fill="#00000022" rx={5} />
      <rect x={w - armWidth} y={0} width={armWidth} height={d} fill="#00000022" rx={5} />
    </g>
  )
}

function BedShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const headboardDepth = Math.min(14, d * 0.1)
  const pillowH = Math.min(30, d * 0.18)
  const fill = colliding ? '#c0605a' : '#e7ddc8'
  return (
    <g>
      <rect x={0} y={0} width={w} height={d} fill={fill} stroke="#00000030" strokeWidth={1} rx={4} />
      <rect x={0} y={0} width={w} height={headboardDepth} fill="#5c4b3a" />
      <rect x={w * 0.06} y={headboardDepth + 6} width={w * 0.38} height={pillowH} rx={6} fill="#ffffffa0" stroke="#00000015" />
      <rect x={w * 0.56} y={headboardDepth + 6} width={w * 0.38} height={pillowH} rx={6} fill="#ffffffa0" stroke="#00000015" />
      <rect x={w * 0.08} y={d * 0.55} width={w * 0.84} height={d * 0.35} rx={4} fill="#ffffff60" />
    </g>
  )
}

function WardrobeShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const fill = colliding ? '#c0605a' : '#6b5847'
  return (
    <g>
      <rect x={0} y={0} width={w} height={d} fill={fill} stroke="#00000040" strokeWidth={1} />
      <line x1={w / 2} y1={2} x2={w / 2} y2={d - 2} stroke="#00000040" strokeWidth={1.5} />
      <circle cx={w / 2 - 6} cy={d / 2} r={2} fill="#eee" />
      <circle cx={w / 2 + 6} cy={d / 2} r={2} fill="#eee" />
    </g>
  )
}

function ChestShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const fill = colliding ? '#c0605a' : '#7a6450'
  const drawers = 3
  return (
    <g>
      <rect x={0} y={0} width={w} height={d} fill={fill} stroke="#00000040" strokeWidth={1} />
      {Array.from({ length: drawers - 1 }, (_, i) => (
        <line key={i} x1={2} y1={((i + 1) * d) / drawers} x2={w - 2} y2={((i + 1) * d) / drawers} stroke="#00000035" strokeWidth={1} />
      ))}
      {Array.from({ length: drawers }, (_, i) => (
        <circle key={i} cx={w / 2} cy={((i + 0.5) * d) / drawers} r={1.6} fill="#eee" />
      ))}
    </g>
  )
}

function DeskShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const fill = colliding ? '#c0605a' : '#a9866a'
  return (
    <g>
      <rect x={0} y={0} width={w} height={d} fill={fill} stroke="#00000040" strokeWidth={1} />
      <rect x={w * 0.62} y={d * 0.15} width={w * 0.3} height={d * 0.7} fill="#00000018" />
    </g>
  )
}

function DiningTableShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const fill = colliding ? '#c0605a' : '#b08a5e'
  return (
    <g>
      <rect x={0} y={0} width={w} height={d} rx={Math.min(w, d) * 0.08} fill={fill} stroke="#00000030" strokeWidth={1} />
      <rect x={4} y={4} width={w - 8} height={d - 8} rx={Math.min(w, d) * 0.06} fill="none" stroke="#00000020" strokeWidth={1} />
    </g>
  )
}

function TVUnitShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const fill = colliding ? '#c0605a' : '#3a3630'
  return (
    <g>
      <rect x={0} y={0} width={w} height={d} fill={fill} stroke="#00000040" strokeWidth={1} />
      <rect x={w * 0.1} y={d * 0.2} width={w * 0.8} height={d * 0.15} fill="#111" />
    </g>
  )
}

function WhiteGoodShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const fill = colliding ? '#c0605a' : '#dcdcdc'
  return (
    <g>
      <rect x={0} y={0} width={w} height={d} fill={fill} stroke="#00000040" strokeWidth={1} />
      <circle cx={w / 2} cy={d / 2} r={Math.min(w, d) * 0.32} fill="none" stroke="#00000040" strokeWidth={2} />
    </g>
  )
}

function CoffeeTableShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const fill = colliding ? '#c0605a' : '#c9a876'
  return <rect x={0} y={0} width={w} height={d} rx={Math.min(w, d) * 0.15} fill={fill} stroke="#00000030" strokeWidth={1} />
}

function CustomShape({ item, colliding }: ShapeProps) {
  const { w, d } = item
  const fill = colliding ? '#c0605a' : '#9a9086'
  return <rect x={0} y={0} width={w} height={d} fill={fill} stroke="#00000040" strokeWidth={1} strokeDasharray="4 3" />
}

export function FurnitureShapeBody(props: ShapeProps) {
  switch (props.item.category) {
    case 'sofa':
      return <SofaShape {...props} />
    case 'lsofa':
      return <LSofaShape {...props} />
    case 'armchair':
      return <ArmchairShape {...props} />
    case 'bed':
      return <BedShape {...props} />
    case 'wardrobe':
      return <WardrobeShape {...props} />
    case 'chest':
      return <ChestShape {...props} />
    case 'desk':
      return <DeskShape {...props} />
    case 'diningTable':
      return <DiningTableShape {...props} />
    case 'tvUnit':
      return <TVUnitShape {...props} />
    case 'whiteGood':
      return <WhiteGoodShape {...props} />
    case 'coffeeTable':
      return <CoffeeTableShape {...props} />
    default:
      return <CustomShape {...props} />
  }
}
