/** Formatting helpers. Internal values stay plain cm numbers; this is display-only. */

export function formatCm(cm: number): string {
  const rounded = Math.round(cm * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}cm` : `${rounded.toFixed(1)}cm`
}

export function formatMetres(cm: number): string {
  return `${(cm / 100).toFixed(2)}m`
}

export function formatInches(cm: number): string {
  const inches = cm / 2.54
  return `${Math.round(inches)}"`
}

export function inchesToCm(inches: number): number {
  return inches * 2.54
}
