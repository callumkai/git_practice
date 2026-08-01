import { describe, expect, it } from 'vitest'
import { wallRuns } from './geometry'
import { eligibleWallRuns, tvWallRunNeeded, tvWidthCm, viewingDistanceStatus } from './tv'

describe('tv sizing — matches the brief: 65" is about 145 wide, needs ~160 clear', () => {
  it('computes ~145cm width for a 65 inch screen', () => {
    expect(tvWidthCm(65)).toBeGreaterThan(140)
    expect(tvWidthCm(65)).toBeLessThan(150)
  })

  it('computes ~160cm wall run needed for a 65 inch screen', () => {
    expect(tvWallRunNeeded(65)).toBeGreaterThan(155)
    expect(tvWallRunNeeded(65)).toBeLessThan(165)
  })
})

describe('eligibleWallRuns — living room rear wall from the brief', () => {
  it('rules out the rear wall runs of 111/77/77 for a 65 inch TV', () => {
    const runs = wallRuns(514, [
      { start: 111, end: 244 },
      { start: 321, end: 437 },
    ])
    expect(eligibleWallRuns(runs, 65)).toEqual([])
  })

  it('allows the 293 hall-wall run and the 349 side walls', () => {
    const runs = [
      { start: 0, end: 293, length: 293 },
      { start: 0, end: 349, length: 349 },
    ]
    expect(eligibleWallRuns(runs, 65)).toHaveLength(2)
  })
})

describe('viewingDistanceStatus', () => {
  it('flags too close, comfortable, and too far', () => {
    expect(viewingDistanceStatus(100, 65)).toBe('too-close')
    expect(viewingDistanceStatus(250, 65)).toBe('comfortable')
    expect(viewingDistanceStatus(600, 65)).toBe('too-far')
  })
})
