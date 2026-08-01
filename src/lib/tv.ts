import { inchesToCm } from './format'
import type { WallRun } from './geometry'

/** Extra margin (cm) beyond the screen width itself for a clear wall run — matches the brief's 65"/145cm/160cm figures. */
export const TV_WALL_MARGIN = 15

const ASPECT_16_9_WIDTH_RATIO = 16 / Math.sqrt(16 * 16 + 9 * 9)

export function tvWidthCm(inches: number): number {
  return inchesToCm(inches) * ASPECT_16_9_WIDTH_RATIO
}

export function tvWallRunNeeded(inches: number): number {
  return tvWidthCm(inches) + TV_WALL_MARGIN
}

export interface ViewingDistanceRange {
  minCm: number
  maxCm: number
}

/**
 * Typical comfortable viewing distance guidance (not a house measurement):
 * roughly 1x-2.5x the screen diagonal, spanning both 4K and HD rules of thumb.
 */
export function comfortableViewingDistance(inches: number): ViewingDistanceRange {
  const diagonalCm = inchesToCm(inches)
  return { minCm: diagonalCm * 1.0, maxCm: diagonalCm * 2.5 }
}

export type ViewingDistanceStatus = 'too-close' | 'comfortable' | 'too-far'

export function viewingDistanceStatus(distanceCm: number, inches: number): ViewingDistanceStatus {
  const { minCm, maxCm } = comfortableViewingDistance(inches)
  if (distanceCm < minCm) return 'too-close'
  if (distanceCm > maxCm) return 'too-far'
  return 'comfortable'
}

/** Wall runs long enough to take a TV of this size. */
export function eligibleWallRuns(runs: WallRun[], inches: number): WallRun[] {
  const needed = tvWallRunNeeded(inches)
  return runs.filter((r) => r.length >= needed)
}
