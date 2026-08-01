import { describe, expect, it } from 'vitest'
import { OPENINGS, resolveOpenings } from './house'

describe('resolveOpenings', () => {
  it('defaults to the sketch (80cm from the right, 92cm from the left)', () => {
    const resolved = resolveOpenings('right')
    expect(resolved).toBe(OPENINGS)
    const win = resolved.find((o) => o.id === 'bedroom1Window')!
    expect(win.from.x - 213).toBeCloseTo(92)
    expect(514 - win.to.x).toBeCloseTo(80)
  })

  it('flips to the typed note (80cm from the left) without changing the window width', () => {
    const resolved = resolveOpenings('left')
    const win = resolved.find((o) => o.id === 'bedroom1Window')!
    expect(win.from.x - 213).toBeCloseTo(80)
    expect(514 - win.to.x).toBeCloseTo(92)
    expect(win.to.x - win.from.x).toBeCloseTo(129)
  })

  it('leaves every other opening untouched', () => {
    const resolved = resolveOpenings('left')
    const others = resolved.filter((o) => o.id !== 'bedroom1Window')
    const originalOthers = OPENINGS.filter((o) => o.id !== 'bedroom1Window')
    expect(others).toEqual(originalOthers)
  })
})
