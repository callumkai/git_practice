import type { FurnitureLibraryEntry } from '../types'

export const FURNITURE_LIBRARY: FurnitureLibraryEntry[] = [
  { id: 'sofa-2seater', category: 'sofa', name: 'Sofa (2-seater)', defaultW: 160, defaultD: 90, source: 'generic' },
  { id: 'sofa-3seater', category: 'sofa', name: 'Sofa (3-seater)', defaultW: 200, defaultD: 90, source: 'generic' },
  { id: 'sofa-4seater', category: 'sofa', name: 'Sofa (4-seater)', defaultW: 240, defaultD: 95, source: 'generic' },
  // Next "Parker" medium corner chaise: W277 x D177cm (their listed H90 is seat height, not a footprint dimension).
  { id: 'lsofa-right', category: 'lsofa', name: 'L-shaped sofa (Next Parker, right chaise)', defaultW: 277, defaultD: 177, source: 'considering', chaiseSide: 'right' },
  { id: 'lsofa-left', category: 'lsofa', name: 'L-shaped sofa (Next Parker, left chaise)', defaultW: 277, defaultD: 177, source: 'considering', chaiseSide: 'left' },
  // DFS "Borghetto" range spec sheet — all footprints (W x D) as printed; listed H (seat/arm height) isn't a floor dimension.
  { id: 'sofa-borghetto-2seater', category: 'sofa', name: 'Borghetto 2 seater', defaultW: 192, defaultD: 102, source: 'considering' },
  { id: 'sofa-borghetto-3seater', category: 'sofa', name: 'Borghetto 3 seater', defaultW: 219, defaultD: 102, source: 'considering' },
  { id: 'sofa-borghetto-4seater', category: 'sofa', name: 'Borghetto 4 seater', defaultW: 258, defaultD: 102, source: 'considering' },
  { id: 'sofa-borghetto-linear', category: 'sofa', name: 'Borghetto linear sofa', defaultW: 255, defaultD: 102, source: 'considering' },
  // "D 102/173" = straight run / overall depth including the lounger; right-hand shown, left also available.
  {
    id: 'lsofa-borghetto-4seater-lounger-right',
    category: 'lsofa',
    name: 'Borghetto 4 seater with lounger (right)',
    defaultW: 255,
    defaultD: 173,
    source: 'considering',
    chaiseSide: 'right',
  },
  {
    id: 'lsofa-borghetto-4seater-lounger-left',
    category: 'lsofa',
    name: 'Borghetto 4 seater with lounger (left)',
    defaultW: 255,
    defaultD: 173,
    source: 'considering',
    chaiseSide: 'left',
  },
  {
    id: 'lsofa-borghetto-large-4seater-lounger-right',
    category: 'lsofa',
    name: 'Borghetto large 4 seater with lounger (right)',
    defaultW: 353,
    defaultD: 173,
    source: 'considering',
    chaiseSide: 'right',
  },
  {
    id: 'lsofa-borghetto-large-4seater-lounger-left',
    category: 'lsofa',
    name: 'Borghetto large 4 seater with lounger (left)',
    defaultW: 353,
    defaultD: 173,
    source: 'considering',
    chaiseSide: 'left',
  },
  { id: 'armchair', category: 'armchair', name: 'Armchair', defaultW: 80, defaultD: 85, source: 'generic' },
  { id: 'armchair-borghetto', category: 'armchair', name: 'Borghetto armchair', defaultW: 130, defaultD: 102, source: 'considering' },
  { id: 'armchair-borghetto-snuggle', category: 'armchair', name: 'Borghetto snuggle chair', defaultW: 156, defaultD: 102, source: 'considering' },
  { id: 'coffee-table', category: 'coffeeTable', name: 'Coffee table', defaultW: 120, defaultD: 60, source: 'generic' },
  { id: 'coffee-table-small', category: 'coffeeTable', name: 'Coffee table (small)', defaultW: 90, defaultD: 50, source: 'generic' },
  { id: 'footstool-borghetto-small', category: 'coffeeTable', name: 'Borghetto storage footstool (small)', defaultW: 63, defaultD: 71, source: 'considering' },
  { id: 'footstool-borghetto-large', category: 'coffeeTable', name: 'Borghetto storage footstool (large)', defaultW: 96, defaultD: 71, source: 'considering' },

  { id: 'bed-mine', category: 'bed', name: 'My bed', defaultW: 160, defaultD: 210, source: 'owned' },
  // UK mattress sizes, smallest to largest. "Queen" isn't a traditional UK size (it's the US 152x203
  // standard) but is now sold by some UK brands, so it's included, ordered by its actual footprint.
  { id: 'bed-single', category: 'bed', name: 'Bed (single)', defaultW: 90, defaultD: 190, source: 'generic' },
  { id: 'bed-small-double', category: 'bed', name: 'Bed (small double)', defaultW: 120, defaultD: 190, source: 'generic' },
  { id: 'bed-double', category: 'bed', name: 'Bed (double)', defaultW: 135, defaultD: 190, source: 'generic' },
  { id: 'bed-king', category: 'bed', name: 'Bed (king)', defaultW: 150, defaultD: 200, source: 'generic' },
  { id: 'bed-queen', category: 'bed', name: 'Bed (queen, US size)', defaultW: 152, defaultD: 203, source: 'generic' },
  { id: 'bed-super-king', category: 'bed', name: 'Bed (super king)', defaultW: 180, defaultD: 200, source: 'generic' },

  { id: 'bedside-table', category: 'bedsideTable', name: 'Bedside table', defaultW: 45, defaultD: 40, source: 'generic' },

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
