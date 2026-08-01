import type { FurnitureItem } from '../types'
import { ROOMS } from './house'

const LIVING_ROOM = ROOMS.find((r) => r.id === 'livingRoom')!.rect

/** Places an item flush against a wall, front facing into the room. `along` is the world position of the item's leading edge along that wall. */
function wallPlacement(wall: 'N' | 'E' | 'S' | 'W', w: number, d: number, along: number): { x: number; y: number; rotation: number } {
  const roomW = LIVING_ROOM.w
  const roomH = LIVING_ROOM.h
  switch (wall) {
    case 'N':
      return { x: along, y: 0, rotation: 0 }
    case 'S':
      return { x: along, y: roomH - d, rotation: 180 }
    case 'W': {
      const centerX = d / 2
      const centerY = along + w / 2
      return { x: centerX - w / 2, y: centerY - d / 2, rotation: 270 }
    }
    case 'E': {
      const centerX = roomW - d / 2
      const centerY = along + w / 2
      return { x: centerX - w / 2, y: centerY - d / 2, rotation: 90 }
    }
  }
}

let seq = 0
function item(partial: Pick<FurnitureItem, 'libraryId' | 'category' | 'name' | 'w' | 'd' | 'x' | 'y' | 'rotation'> & Partial<FurnitureItem>): FurnitureItem {
  seq += 1
  return { id: `preset-${seq}`, source: 'generic', ...partial }
}

/** Five starting living-room presets. Placements are original arrangements built for this room, not survey data. */
export function buildLivingRoomPresets(): { name: string; items: FurnitureItem[] }[] {
  seq = 0

  const cinema: FurnitureItem[] = [
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 90) }),
    item({ libraryId: 'sofa-4seater', category: 'sofa', name: 'Sofa (4-seater)', w: 240, d: 95, ...wallPlacement('W', 240, 95, 40) }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 260, y: 20, rotation: 90 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 145, y: 137, rotation: 90 }),
  ]

  const lShaped: FurnitureItem[] = [
    item({ libraryId: 'lsofa-right', category: 'lsofa', name: 'L-shaped sofa', w: 260, d: 160, chaiseSide: 'right', x: 254, y: 189, rotation: 0 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 280, y: 115, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 20) }),
  ]

  const longThrow: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, ...wallPlacement('W', 200, 90, 30) }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 60) }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 110, y: 138, rotation: 90 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, ...wallPlacement('W', 80, 85, 240) }),
  ]

  const threePiece: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, ...wallPlacement('S', 200, 90, 260) }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 300, y: 154, rotation: 0 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair 1', w: 80, d: 85, ...wallPlacement('E', 80, 85, 100) }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair 2', w: 80, d: 85, x: 200, y: 90, rotation: 270 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('W', 150, 40, 190) }),
  ]

  const floatingSofa: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, x: 300, y: 150, rotation: 90 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 100, d: 55, x: 210, y: 167.5, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 130) }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 20, y: 20, rotation: 90 }),
  ]

  return [
    { name: 'Cinema', items: cinema },
    { name: 'L-shaped sofa', items: lShaped },
    { name: 'Long throw', items: longThrow },
    { name: 'Three-piece', items: threePiece },
    { name: 'Floating sofa', items: floatingSofa },
  ]
}
