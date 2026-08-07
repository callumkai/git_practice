import type { FurnitureLibraryEntry } from '../types'

export const FURNITURE_LIBRARY: FurnitureLibraryEntry[] = [
  { id: 'sofa-2seater', category: 'sofa', name: 'Sofa (2-seater)', defaultW: 160, defaultD: 90, source: 'generic' },
  { id: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', defaultW: 200, defaultD: 90, source: 'generic' },
  { id: 'sofa-4seater', category: 'sofa', name: 'Sofa (4-seater)', defaultW: 240, defaultD: 95, source: 'generic' },
  // Next "Parker" medium corner chaise: W277 x D177cm (their listed H90 is seat height, not a footprint dimension).
  { id: 'lsofa-right', category: 'lsofa', name: 'L-shaped sofa (Next Parker, right chaise)', defaultW: 277, defaultD: 177, source: 'considering', chaiseSide: 'right' },
  { id: 'lsofa-left', category: 'lsofa', name: 'L-shaped sofa (Next Parker, left chaise)', defaultW: 277, defaultD: 177, source: 'considering', chaiseSide: 'left' },
  { id: 'armchair', category: 'armchair', name: 'Armchair', defaultW: 80, defaultD: 85, source: 'generic' },
  { id: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', defaultW: 120, defaultD: 60, source: 'generic' },
  { id: 'coffee-table-small', category: 'coffeeTable', name: 'Coffee table (small)', defaultW: 90, defaultD: 50, source: 'generic' },

  { id: 'bed-mine', category: 'bed', name: 'My bed', defaultW: 160, defaultD: 210, source: 'owned' },
  { id: 'bed-single', category: 'bed', name: 'Bed (single)', defaultW: 90, defaultD: 190, source: 'generic' },
  { id: 'bed-double', category: 'bed', name: 'Bed (double)', defaultW: 135, defaultD: 190, source: 'generic' },
  { id: 'bed-king', category: 'bed', name: 'Bed (king)', defaultW: 150, defaultD: 200, source: 'generic' },
  { id: 'bed-super-king', category: 'bed', name: 'Bed (super king)', defaultW: 180, defaultD: 200, source: 'generic' },

  { id: 'wardrobe-double', category: 'wardrobe', name: 'Wardrobe (double)', defaultW: 100, defaultD: 60, source: 'generic' },
  { id: 'wardrobe-triple', category: 'wardrobe', name: 'Wardrobe (triple)', defaultW: 150, defaultD: 60, source: 'generic' },
  { id: 'chest-drawers', category: 'chest', name: 'Chest of drawers', defaultW: 80, defaultD: 45, source: 'generic' },
  { id: 'desk', category: 'desk', name: 'Desk', defaultW: 120, defaultD: 60, source: 'generic' },

  { id: 'dining-table-4', category: 'diningTable', name: 'Dining table (4-seat)', defaultW: 120, defaultD: 80, source: 'generic' },
  { id: 'dining-table-6', category: 'diningTable', name: 'Dining table (6-seat)', defaultW: 160, defaultD: 90, source: 'generic' },

  { id: 'tv-unit', category: 'tvUnit', name: 'TV unit', defaultW: 150, defaultD: 40, source: 'generic' },

  { id: 'fridge-freezer', category: 'whiteGood', name: 'Fridge freezer', defaultW: 60, defaultD: 65, source: 'generic' },
  { id: 'washing-machine', category: 'whiteGood', name: 'Washing machine', defaultW: 60, defaultD: 60, source: 'generic' },
  { id: 'dishwasher', category: 'whiteGood', name: 'Dishwasher', defaultW: 60, defaultD: 60, source: 'generic' },
  { id: 'oven', category: 'whiteGood', name: 'Oven', defaultW: 60, defaultD: 60, source: 'generic' },
]

export function libraryEntryById(id: string): FurnitureLibraryEntry | undefined {
  return FURNITURE_LIBRARY.find((e) => e.id === id)
}
