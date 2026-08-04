import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { FloorOverview } from './components/FloorPlan/FloorOverview'
import { RoomView } from './components/RoomView'
import { useStore } from './store/useStore'
import type { FloorId } from './types'

function useImportExport() {
  const exportJSON = useStore((s) => s.exportJSON)
  const importJSON = useStore((s) => s.importJSON)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onExport = () => {
    const json = exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mulberry-grove-layouts-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const onImportClick = () => fileInputRef.current?.click()

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await importJSON(text)
    e.target.value = ''
  }

  return { fileInputRef, onExport, onImportClick, onFileSelected }
}

export default function App() {
  const hydrated = useStore((s) => s.hydrated)
  const hydrate = useStore((s) => s.hydrate)
  const floor = useStore((s) => s.floor)
  const setFloor = useStore((s) => s.setFloor)
  const roomId = useStore((s) => s.roomId)
  const setRoom = useStore((s) => s.setRoom)
  const { fileInputRef, onExport, onImportClick, onFileSelected } = useImportExport()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return (
      <div className="h-svh flex items-center justify-center bg-paper">
        <p className="text-sm opacity-60">Loading your house...</p>
      </div>
    )
  }

  return (
    <div className="h-svh flex flex-col bg-paper text-neutral-900">
      <header className="flex items-center gap-2 px-3 py-2 border-b border-black/10">
        <h1 className="font-semibold text-sm sm:text-base">4 Mulberry Grove</h1>
        <div className="flex gap-1 ml-2">
          {(['ground', 'first'] as FloorId[]).map((f) => (
            <button
              key={f}
              className={`min-h-10 px-3 py-2 text-xs rounded capitalize ${floor === f && !roomId ? 'bg-blue-600 text-white' : 'bg-black/5 hover:bg-black/10'}`}
              onClick={() => {
                setFloor(f)
              }}
            >
              {f} floor
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <button className="min-h-10 px-3 py-2 text-xs rounded bg-black/5 hover:bg-black/10" onClick={onExport}>
            Export JSON
          </button>
          <button className="min-h-10 px-3 py-2 text-xs rounded bg-black/5 hover:bg-black/10" onClick={onImportClick}>
            Import JSON
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFileSelected} />
        </div>
      </header>

      <main className="flex-1 p-3 min-h-0 overflow-y-auto">
        {roomId ? <RoomView roomId={roomId} onBack={() => setRoom(null)} /> : <FloorOverview floor={floor} onSelectRoom={setRoom} />}
      </main>
    </div>
  )
}
