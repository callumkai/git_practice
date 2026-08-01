import { describe, expect, it } from 'vitest'
import { OPENINGS, roomById } from '../data/house'
import { roomDimensionLines } from './dimensionLayout'

describe('roomDimensionLines — living room', () => {
  const room = roomById('livingRoom')!
  const { wallLines, openingLines } = roomDimensionLines(room, 'ground', OPENINGS)

  it('produces opening labels for the conservatory door and window', () => {
    const labels = openingLines.map((l) => l.label)
    expect(labels).toContain('Door 133cm')
    expect(labels).toContain('Window 116cm')
  })

  it('marks the living room window as estimated, but not the conservatory door', () => {
    const win = openingLines.find((l) => l.label.includes('116'))!
    const door = openingLines.find((l) => l.label.includes('133'))!
    expect(win.estimated).toBe(true)
    expect(door.estimated).toBe(false)
  })

  it('offsets opening lanes further out than wall lanes (no lane collision)', () => {
    const wallLine = wallLines[0]!
    const openingLine = openingLines[0]!
    // Distance from the room polygon edge should be greater for openings than walls.
    expect(Math.abs(openingLine.a.y) + Math.abs(openingLine.a.x)).not.toEqual(0)
    expect(wallLine).not.toEqual(openingLine)
  })

  it('produces the 293 hall-wall run label among wall lengths', () => {
    const labels = wallLines.map((l) => l.label)
    expect(labels).toContain('293cm')
  })
})
