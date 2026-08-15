export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type FloorId = 'ground' | 'first'

export interface RoomDef {
  id: string
  name: string
  floor: FloorId
  /** Primary bounding rect, used for simple rooms and as the render bounds for compound ones. */
  rect: Rect
  /** Extra rects for hit-testing compound (non-rectangular) rooms, e.g. Bedroom 2. */
  extraRects?: Rect[]
  /** Explicit polygon for rendering non-rectangular rooms. Omit for plain rectangles. */
  polygon?: Point[]
}

export type OpeningKind = 'door' | 'window' | 'fittedWardrobe'

export interface OpeningDef {
  id: string
  label: string
  kind: OpeningKind
  size: number
  from: Point
  to: Point
  floor: FloorId
  /** Room this opening is considered to belong to / serve. */
  servesRoomId: string
  /** For doors: which room the swing arc sweeps into. Absent = no swing drawn (windows, wardrobes). */
  swingIntoRoomId?: string
  /** True if the position along the wall is an estimate rather than a survey figure. Size is never estimated. */
  positionEstimated?: boolean
}

export type FurnitureCategory =
  | 'sofa'
  | 'lsofa'
  | 'armchair'
  | 'coffeeTable'
  | 'bed'
  | 'bedsideTable'
  | 'wardrobe'
  | 'chest'
  | 'desk'
  | 'diningTable'
  | 'tvUnit'
  | 'whiteGood'
  | 'custom'

export type FurnitureSource = 'owned' | 'considering' | 'generic'

export interface FurnitureLibraryEntry {
  id: string
  category: FurnitureCategory
  name: string
  defaultW: number
  defaultD: number
  source: FurnitureSource
  chaiseSide?: 'left' | 'right'
  color?: string
}

export interface FurnitureItem {
  id: string
  libraryId: string
  category: FurnitureCategory
  name: string
  /** Footprint width/depth in cm, unrotated. */
  w: number
  d: number
  /** Top-left corner of the unrotated footprint, room-local cm. */
  x: number
  y: number
  /** Degrees clockwise, about the footprint's centre. */
  rotation: number
  chaiseSide?: 'left' | 'right'
  source: FurnitureSource
  color?: string
}

export interface Layout {
  id: string
  roomId: string
  name: string
  items: FurnitureItem[]
  createdAt: number
  updatedAt: number
  isPreset?: boolean
}

export interface HouseSettings {
  frontDoorWidth?: number
  narrowestHallWidth?: number
  stairTurnClearance?: number
  /** Bedroom 1 window: brief has a conflicting note (80 from left vs 80 from right). */
  bedroom1WindowSide: 'left' | 'right'
}

export interface ClearanceResult {
  ruleId: string
  label: string
  pass: boolean
  detail: string
  itemIds: string[]
}

export interface CollisionResult {
  itemId: string
  colliding: boolean
  reasons: string[]
}
