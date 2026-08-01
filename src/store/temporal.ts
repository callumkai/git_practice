import type { StateCreator, StoreApi } from 'zustand'

export interface TemporalSlice {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  /** Call before a discrete mutation you want to be able to undo (not on every drag frame — see commitItemMove). */
  checkpoint: () => void
}

type PlainSet<T> = (partial: Partial<T> | ((state: T & TemporalSlice) => Partial<T>)) => void
type PlainGet<T> = () => T & TemporalSlice

/**
 * Hand-rolled undo/redo middleware: callers explicitly `checkpoint()` before
 * a discrete change (drag end, rotate, delete, add), rather than snapshotting
 * on every `set` call — a high-frequency drag would otherwise flood history
 * with hundreds of intermediate frames.
 */
export function temporal<T extends object>(
  config: (set: PlainSet<T>, get: PlainGet<T>, api: StoreApi<T & TemporalSlice>) => T,
  trackedKeys: (keyof T)[],
  limit = 50,
): StateCreator<T & TemporalSlice, [], [], T & TemporalSlice> {
  return (set, get, api) => {
    let past: Partial<T>[] = []
    let future: Partial<T>[] = []

    const snapshot = (): Partial<T> => {
      const state = get()
      const snap: Partial<T> = {}
      for (const key of trackedKeys) snap[key] = structuredClone(state[key])
      return snap
    }

    return {
      ...config(set as unknown as PlainSet<T>, get, api),
      canUndo: false,
      canRedo: false,
      checkpoint: () => {
        past.push(snapshot())
        if (past.length > limit) past.shift()
        future = []
        set({ canUndo: true, canRedo: false } as Partial<T & TemporalSlice>)
      },
      undo: () => {
        if (past.length === 0) return
        future.push(snapshot())
        const prev = past.pop()!
        set({ ...prev, canUndo: past.length > 0, canRedo: true } as Partial<T & TemporalSlice>)
      },
      redo: () => {
        if (future.length === 0) return
        past.push(snapshot())
        const next = future.pop()!
        set({ ...next, canUndo: true, canRedo: future.length > 0 } as Partial<T & TemporalSlice>)
      },
    }
  }
}
