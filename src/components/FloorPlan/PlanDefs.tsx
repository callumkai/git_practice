export function PlanDefs() {
  return (
    <defs>
      <pattern id="floorPlanks" width={26} height={140} patternUnits="userSpaceOnUse">
        <rect width={26} height={140} fill="var(--color-floor)" />
        <line x1={0} y1={0} x2={0} y2={140} stroke="var(--color-floor-line)" strokeWidth={1} opacity={0.5} />
        <line x1={0} y1={46} x2={26} y2={46} stroke="var(--color-floor-line)" strokeWidth={0.5} opacity={0.35} />
        <line x1={0} y1={93} x2={26} y2={93} stroke="var(--color-floor-line)" strokeWidth={0.5} opacity={0.35} />
      </pattern>
    </defs>
  )
}
