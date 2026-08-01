import type { FurnitureItem, HouseSettings } from '../types'

export interface AccessWarning {
  itemId: string
  detail: string
}

/**
 * Rough "could this have got through the house" check: compares the item's
 * narrowest footprint dimension against the tightest known access point.
 * This ignores diagonal manoeuvring, so it's a conservative heuristic, not a
 * guarantee — the brief's front door / hall / stair-turn figures are unmeasured,
 * so this only runs once the user has entered them.
 */
export function findAccessWarnings(items: FurnitureItem[], settings: Pick<HouseSettings, 'frontDoorWidth' | 'narrowestHallWidth' | 'stairTurnClearance'>): AccessWarning[] {
  const constraints: { label: string; value: number | undefined }[] = [
    { label: 'front door', value: settings.frontDoorWidth },
    { label: 'narrowest hall width', value: settings.narrowestHallWidth },
    { label: 'stair turn', value: settings.stairTurnClearance },
  ]
  const knownConstraints = constraints.filter((c): c is { label: string; value: number } => typeof c.value === 'number')
  if (knownConstraints.length === 0) return []

  const warnings: AccessWarning[] = []
  for (const item of items) {
    const narrowest = Math.min(item.w, item.d)
    for (const c of knownConstraints) {
      if (narrowest > c.value) {
        warnings.push({ itemId: item.id, detail: `${item.name}'s narrowest side (${narrowest}cm) is wider than the ${c.label} (${c.value}cm).` })
      }
    }
  }
  return warnings
}
