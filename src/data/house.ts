import type { OpeningDef, RoomDef } from '../types'

/**
 * Ground truth survey data for 4 Mulberry Grove.
 * All figures cm, origin top-left of each floor, x right, y down.
 * Do not round or "tidy" — see the build brief.
 */

export const HOUSE_WIDTH = 514
export const GROUND_FLOOR_DEPTH = 789
export const FIRST_FLOOR_DEPTH = 781

export const ROOMS: RoomDef[] = [
  // Ground floor
  { id: 'conservatory', name: 'Conservatory', floor: 'ground', rect: { x: 40, y: -246, w: 300, h: 246 } },
  { id: 'livingRoom', name: 'Living Room', floor: 'ground', rect: { x: 0, y: 0, w: 514, h: 349 } },
  { id: 'kitchenDining', name: 'Kitchen / Dining', floor: 'ground', rect: { x: 221, y: 349, w: 293, h: 440 } },
  { id: 'hall', name: 'Hall', floor: 'ground', rect: { x: 95, y: 349, w: 126, h: 440 } },
  { id: 'stairs', name: 'Stairs', floor: 'ground', rect: { x: 0, y: 349, w: 95, h: 240 } },
  { id: 'wc', name: 'W.C.', floor: 'ground', rect: { x: 0, y: 600, w: 95, h: 189 } },

  // First floor
  { id: 'bedroom3', name: 'Bedroom 3', floor: 'first', rect: { x: 0, y: 0, w: 245, h: 206 } },
  {
    id: 'bedroom2',
    name: 'Bedroom 2',
    floor: 'first',
    rect: { x: 254, y: 0, w: 260, h: 311 },
    extraRects: [
      { x: 295, y: 0, w: 219, h: 311 },
      { x: 254, y: 214, w: 260, h: 97 },
    ],
    polygon: [
      { x: 295, y: 0 },
      { x: 514, y: 0 },
      { x: 514, y: 311 },
      { x: 254, y: 311 },
      { x: 254, y: 214 },
      { x: 295, y: 214 },
    ],
  },
  { id: 'landing', name: 'Landing', floor: 'first', rect: { x: 0, y: 206, w: 202, h: 384 } },
  { id: 'ensuite', name: 'En-suite', floor: 'first', rect: { x: 349, y: 339, w: 165, h: 121 } },
  { id: 'bedroom1', name: 'Bedroom 1', floor: 'first', rect: { x: 213, y: 460, w: 301, h: 321 } },
  { id: 'bathroom', name: 'Bathroom', floor: 'first', rect: { x: 0, y: 590, w: 202, h: 191 } },
]

export const OPENINGS: OpeningDef[] = [
  // Ground floor
  {
    id: 'conservatoryDoor',
    label: 'Conservatory door',
    kind: 'door',
    size: 133,
    from: { x: 111, y: 0 },
    to: { x: 244, y: 0 },
    floor: 'ground',
    servesRoomId: 'conservatory',
    swingIntoRoomId: 'conservatory',
  },
  {
    id: 'livingRoomWindow',
    label: 'Living room window',
    kind: 'window',
    size: 116,
    from: { x: 321, y: 0 },
    to: { x: 437, y: 0 },
    floor: 'ground',
    servesRoomId: 'livingRoom',
    positionEstimated: true,
  },
  {
    id: 'hallToLivingRoomDoor',
    label: 'Living room door to hall',
    kind: 'door',
    size: 90,
    from: { x: 131, y: 349 },
    to: { x: 221, y: 349 },
    floor: 'ground',
    servesRoomId: 'livingRoom',
    swingIntoRoomId: 'livingRoom',
  },
  {
    id: 'kitchenDoor',
    label: 'Kitchen door',
    kind: 'door',
    size: 83,
    from: { x: 221, y: 400 },
    to: { x: 221, y: 483 },
    floor: 'ground',
    servesRoomId: 'kitchenDining',
    swingIntoRoomId: 'kitchenDining',
  },

  // First floor
  {
    id: 'bedroom3Window',
    label: 'Bedroom 3 window',
    kind: 'window',
    size: 126,
    from: { x: 77, y: 0 },
    to: { x: 203, y: 0 },
    floor: 'first',
    servesRoomId: 'bedroom3',
  },
  {
    id: 'bedroom3Door',
    label: 'Bedroom 3 door',
    kind: 'door',
    size: 90,
    from: { x: 2, y: 206 },
    to: { x: 92, y: 206 },
    floor: 'first',
    servesRoomId: 'bedroom3',
    swingIntoRoomId: 'bedroom3',
  },
  {
    id: 'bedroom2Window',
    label: 'Bedroom 2 window',
    kind: 'window',
    size: 126,
    from: { x: 361, y: 0 },
    to: { x: 487, y: 0 },
    floor: 'first',
    servesRoomId: 'bedroom2',
  },
  {
    id: 'bedroom2Door',
    label: 'Bedroom 2 door',
    kind: 'door',
    size: 91,
    from: { x: 254, y: 220 },
    to: { x: 254, y: 311 },
    floor: 'first',
    servesRoomId: 'bedroom2',
    swingIntoRoomId: 'bedroom2',
  },
  // Built into the wall recess (zero floor depth of its own) with two hinged
  // doors, each opening outward into the room — modelled as two door leaves,
  // hinged at the outer edges, splitting the surveyed 136cm width evenly
  // (the 68/68 split is an assumption; the total width is the survey figure).
  {
    id: 'bedroom1WardrobeDoorLeft',
    label: 'Bedroom 1 fitted wardrobe (left door)',
    kind: 'fittedWardrobe',
    size: 68,
    from: { x: 221, y: 460 },
    to: { x: 289, y: 460 },
    floor: 'first',
    servesRoomId: 'bedroom1',
    swingIntoRoomId: 'bedroom1',
  },
  {
    id: 'bedroom1WardrobeDoorRight',
    label: 'Bedroom 1 fitted wardrobe (right door)',
    kind: 'fittedWardrobe',
    size: 68,
    from: { x: 357, y: 460 },
    to: { x: 289, y: 460 },
    floor: 'first',
    servesRoomId: 'bedroom1',
    swingIntoRoomId: 'bedroom1',
  },
  {
    id: 'bedroom1EnsuiteDoor',
    label: 'Bedroom 1 en-suite door',
    kind: 'door',
    size: 81,
    from: { x: 365, y: 460 },
    to: { x: 446, y: 460 },
    floor: 'first',
    servesRoomId: 'bedroom1',
    swingIntoRoomId: 'ensuite',
  },
  {
    id: 'bedroom1Door',
    label: 'Bedroom 1 door',
    kind: 'door',
    size: 90,
    from: { x: 213, y: 464 },
    to: { x: 213, y: 554 },
    floor: 'first',
    servesRoomId: 'bedroom1',
    swingIntoRoomId: 'bedroom1',
  },
  {
    id: 'bedroom1Window',
    label: 'Bedroom 1 window',
    kind: 'window',
    size: 129,
    from: { x: 305, y: 781 },
    to: { x: 434, y: 781 },
    floor: 'first',
    servesRoomId: 'bedroom1',
    positionEstimated: true,
  },
]

/** Kitchen fitted units: worktop run along the right-hand wall. */
export const KITCHEN_WORKTOP = {
  depth: 59,
  wall: { x1: 455, y1: 349, x2: 514, y2: 789 },
  applianceGaps: [62, 62, 60] as [number, number, number],
  wallCabinetClearance: 42,
}

export function roomById(id: string): RoomDef | undefined {
  return ROOMS.find((r) => r.id === id)
}

export function openingsForRoom(roomId: string): OpeningDef[] {
  return OPENINGS.filter((o) => o.servesRoomId === roomId)
}

/**
 * OPENINGS holds the default-assumed Bedroom 1 window position (80cm from
 * the right, per the sketch). The brief's typed note says 80cm from the
 * left instead — this resolves whichever the user has toggled to, so the
 * plan actually redraws rather than just storing the preference.
 */
export function resolveOpenings(bedroom1WindowSide: 'left' | 'right'): OpeningDef[] {
  if (bedroom1WindowSide === 'right') return OPENINGS
  const bedroom1 = roomById('bedroom1')!
  const windowWidth = 129
  const fromLeft = 80
  const wallStartX = bedroom1.rect.x
  return OPENINGS.map((o) => {
    if (o.id !== 'bedroom1Window') return o
    return { ...o, from: { x: wallStartX + fromLeft, y: o.from.y }, to: { x: wallStartX + fromLeft + windowWidth, y: o.to.y } }
  })
}

export function roomsForFloor(floor: 'ground' | 'first'): RoomDef[] {
  return ROOMS.filter((r) => r.floor === floor)
}
