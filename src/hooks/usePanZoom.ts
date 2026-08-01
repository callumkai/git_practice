import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { screenToSvgPoint } from '../lib/svgCoords'

export interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

interface ActivePointer {
  clientX: number
  clientY: number
}

/**
 * Pan/zoom for an SVG plan, expressed as a `viewBox` in the same cm units as
 * the plan itself. Zoom (wheel or pinch) is anchored at the cursor / pinch
 * midpoint every frame — recomputing the anchor continuously (rather than
 * once at gesture start) is what keeps the anchored point glued under the
 * fingers instead of drifting, which is the classic pinch-zoom bug.
 */
export function usePanZoom(initial: ViewBox, svgRef: React.RefObject<SVGSVGElement | null>) {
  const [viewBox, setViewBox] = useState<ViewBox>(initial)
  const pointers = useRef(new Map<number, ActivePointer>())
  const lastDistance = useRef<number | null>(null)
  const lastPan = useRef<{ x: number; y: number } | null>(null)

  const minSize = Math.min(initial.w, initial.h) * 0.15
  const maxSize = Math.max(initial.w, initial.h) * 4

  const zoomAt = useCallback(
    (anchor: { x: number; y: number }, factor: number) => {
      setViewBox((vb) => {
        const clampedFactor = Math.max(minSize / vb.w, Math.min(maxSize / vb.w, factor))
        const w = vb.w * clampedFactor
        const h = vb.h * clampedFactor
        const x = anchor.x - (anchor.x - vb.x) * clampedFactor
        const y = anchor.y - (anchor.y - vb.y) * clampedFactor
        return { x, y, w, h }
      })
    },
    [minSize, maxSize],
  )

  const panBy = useCallback((dxSvg: number, dySvg: number) => {
    setViewBox((vb) => ({ ...vb, x: vb.x - dxSvg, y: vb.y - dySvg }))
  }, [])

  const onPointerDown = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY })
    if (pointers.current.size === 1) {
      lastPan.current = { x: e.clientX, y: e.clientY }
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      lastDistance.current = Math.hypot(a!.clientX - b!.clientX, a!.clientY - b!.clientY)
    }
  }, [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY })
      const svg = svgRef.current
      if (!svg) return

      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]
        const distance = Math.hypot(a!.clientX - b!.clientX, a!.clientY - b!.clientY)
        const midClient = { x: (a!.clientX + b!.clientX) / 2, y: (a!.clientY + b!.clientY) / 2 }
        const anchor = screenToSvgPoint(svg, midClient.x, midClient.y)
        if (lastDistance.current && lastDistance.current > 0) {
          const factor = lastDistance.current / distance
          zoomAt(anchor, factor)
        }
        lastDistance.current = distance
      } else if (pointers.current.size === 1 && lastPan.current) {
        const p1 = screenToSvgPoint(svg, lastPan.current.x, lastPan.current.y)
        const p2 = screenToSvgPoint(svg, e.clientX, e.clientY)
        panBy(p2.x - p1.x, p2.y - p1.y)
        lastPan.current = { x: e.clientX, y: e.clientY }
      }
    },
    [svgRef, zoomAt, panBy],
  )

  const endPointer = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    lastDistance.current = null
    if (pointers.current.size === 1) {
      const [remaining] = [...pointers.current.values()]
      lastPan.current = { x: remaining!.clientX, y: remaining!.clientY }
    } else {
      lastPan.current = null
    }
  }, [])

  // React marks onWheel as a passive listener, so e.preventDefault() there
  // silently fails and the page scrolls instead of the plan zooming.
  // Attaching natively with { passive: false } is the only way to stop that.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const anchor = screenToSvgPoint(svg, e.clientX, e.clientY)
      const factor = Math.exp(e.deltaY * 0.001)
      zoomAt(anchor, factor)
    }
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [svgRef, zoomAt])

  const resetView = useCallback(() => setViewBox(initial), [initial])

  return useMemo(
    () => ({
      viewBox,
      viewBoxAttr: `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`,
      handlers: { onPointerDown, onPointerMove, onPointerUp: endPointer, onPointerCancel: endPointer },
      resetView,
    }),
    [viewBox, onPointerDown, onPointerMove, endPointer, resetView],
  )
}
