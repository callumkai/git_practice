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

  // Sofa and armchair both face the TV head-on, table centred between them and it.
  const cinema: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, x: 200, y: 90, rotation: 0 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 410, y: 95, rotation: 0 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 285, y: 225, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('S', 150, 40, 300) }),
  ]

  // Sofa anchors the bottom-right corner, open end facing the TV on the west wall,
  // coffee table tucked into the pocket where the arm and chaise meet.
  const lShaped: FurnitureItem[] = [
    item({ libraryId: 'lsofa-right', category: 'lsofa', name: 'L-shaped sofa', w: 260, d: 160, chaiseSide: 'right', x: 304, y: 139, rotation: 90 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 110, d: 55, x: 230, y: 210, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('W', 150, 40, 100) }),
  ]

  // Seating flush on the west wall, TV flush on the east wall — the full 514cm
  // width of the room between them, the long throw the name promises.
  const longThrow: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, ...wallPlacement('W', 200, 90, 40) }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, ...wallPlacement('W', 80, 85, 260) }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 102, y: 160, rotation: 270 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 140) }),
  ]

  // Classic U: sofa on the south wall (clear of the hall-door swing), two
  // armchairs angled in from the sides, table centred between all three.
  const threePiece: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, ...wallPlacement('S', 200, 90, 270) }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair 1', w: 80, d: 85, x: 120, y: 150, rotation: 90 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair 2', w: 80, d: 85, x: 340, y: 150, rotation: 270 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 210, y: 195, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('W', 150, 40, 190) }),
  ]

  // Sofa floats mid-room facing west, back to the walkway, dividing the room
  // into an entry strip and a lounge zone; armchair completes the grouping.
  const floatingSofa: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, x: 290, y: 130, rotation: 90 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 230, y: 220, rotation: 270 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 180, y: 145, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('W', 150, 40, 190) }),
  ]

  return [
    { name: 'Cinema', items: cinema },
    { name: 'L-shaped sofa', items: lShaped },
    { name: 'Long throw', items: longThrow },
    { name: 'Three-piece', items: threePiece },
    { name: 'Floating sofa', items: floatingSofa },
  ]
}
