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

/**
 * Eight starting living-room layouts, matching the option set the user
 * sketched out (mockup names/compositions), adapted to fit this room's real
 * openings and the hall-door swing. Placements are original arrangements
 * built for this room, not survey data.
 */
export function buildLivingRoomPresets(): { name: string; items: FurnitureItem[] }[] {
  seq = 0

  // Sofa across the top wall, armchair bottom-left near the door, TV centred
  // on the hall wall, table between seating and screen.
  const cinemaRoom: FurnitureItem[] = [
    item({ libraryId: 'sofa-4seater', category: 'sofa', name: 'Sofa (4-seater)', w: 240, d: 95, x: 137, y: 45, rotation: 0 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 30, y: 190, rotation: 90 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 197, y: 180, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('S', 150, 40, 293) }),
  ]

  // L-shaped sofa (chaise on the left) fills the top-left corner under the
  // conservatory door, table in its open pocket, armchair opposite, TV east.
  const conversation: FurnitureItem[] = [
    item({ libraryId: 'lsofa-left', category: 'lsofa', name: 'L-shaped sofa', w: 260, d: 160, chaiseSide: 'left', x: 0, y: 0, rotation: 0 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 110, d: 55, x: 170, y: 170, rotation: 0 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 390, y: 250, rotation: 180 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 80) }),
  ]

  // A bigger L-shaped sofa doing more of the work: same top-left anchor,
  // table centred in front, TV on the hall wall.
  const lShapedSofa: FurnitureItem[] = [
    item({ libraryId: 'lsofa-left', category: 'lsofa', name: 'L-shaped sofa', w: 280, d: 170, chaiseSide: 'left', x: 0, y: 0, rotation: 0 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 200, y: 190, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('S', 150, 40, 280) }),
  ]

  // Sofa floats mid-room facing the TV on the east wall, back to the walkway;
  // armchair top-left, table in front of the sofa.
  const floatingSofa: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, x: 290, y: 130, rotation: 90 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 30, y: 30, rotation: 270 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 180, y: 145, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 130) }),
  ]

  // TV tucked near the top of the east wall; two chairs cluster top-left,
  // table between them, sofa along the hall wall clear of the door swing.
  const cornerTv: FurnitureItem[] = [
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair 1', w: 80, d: 85, x: 30, y: 40, rotation: 180 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair 2', w: 80, d: 85, x: 30, y: 150, rotation: 270 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 110, d: 55, x: 150, y: 150, rotation: 0 }),
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, ...wallPlacement('S', 200, 90, 230) }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 120, d: 35, ...wallPlacement('E', 120, 35, 5) }),
  ]

  // Sofa across the top plus a single armchair — simpler and cosier, TV on
  // the hall wall.
  const largeSofaAndChair: FurnitureItem[] = [
    item({ libraryId: 'sofa-4seater', category: 'sofa', name: 'Sofa (4-seater)', w: 240, d: 95, x: 137, y: 40, rotation: 0 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 280, y: 200, rotation: 180 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('S', 150, 40, 320) }),
  ]

  // Two sofas face each other across a shared table — a proper symmetrical
  // conversation set. TV moves to the east wall, since two full-width sofas
  // leave no clear run on the hall wall for one (a real constraint of this
  // room, not a fudge).
  const symmetrical: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater) 1', w: 200, d: 90, x: 155, y: 30, rotation: 0 }),
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater) 2', w: 200, d: 90, x: 230, y: 259, rotation: 180 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 120, d: 60, x: 177, y: 165, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 155) }),
  ]

  // Sofa top-left, armchair by the window for a reading nook, table between,
  // TV on the east wall.
  const readingCorner: FurnitureItem[] = [
    item({ libraryId: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', w: 200, d: 90, x: 20, y: 30, rotation: 0 }),
    item({ libraryId: 'armchair', category: 'armchair', name: 'Armchair', w: 80, d: 85, x: 400, y: 30, rotation: 180 }),
    item({ libraryId: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', w: 110, d: 55, x: 200, y: 160, rotation: 0 }),
    item({ libraryId: 'tv-unit', category: 'tvUnit', name: 'TV unit', w: 150, d: 40, ...wallPlacement('E', 150, 40, 190) }),
  ]

  return [
    { name: 'Cinema Room', items: cinemaRoom },
    { name: 'Conversation Layout', items: conversation },
    { name: 'L-Shaped Sofa Layout', items: lShapedSofa },
    { name: 'Floating Sofa Layout', items: floatingSofa },
    { name: 'Corner TV Layout', items: cornerTv },
    { name: 'Large Sofa + Chair', items: largeSofaAndChair },
    { name: 'Symmetrical Layout', items: symmetrical },
    { name: 'Reading Corner Layout', items: readingCorner },
  ]
}
