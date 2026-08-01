import type { FurnitureItem, RoomDef } from '../types'
import { formatCm } from './format'
import { itemFootprintPolygon } from './furnitureShape'
import { polygonBounds } from './geometry'

const SVG_NS = 'http://www.w3.org/2000/svg'

function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', SVG_NS)
  const bg = clone.querySelector('rect[data-export-bg]')
  if (!bg) {
    const rect = document.createElementNS(SVG_NS, 'rect')
    const vb = clone.viewBox.baseVal
    rect.setAttribute('x', String(vb.x))
    rect.setAttribute('y', String(vb.y))
    rect.setAttribute('width', String(vb.width))
    rect.setAttribute('height', String(vb.height))
    rect.setAttribute('fill', '#f4ede1')
    rect.setAttribute('data-export-bg', 'true')
    clone.insertBefore(rect, clone.firstChild)
  }
  return new XMLSerializer().serializeToString(clone)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadSvg(svg: SVGSVGElement, filename: string) {
  const svgString = serializeSvg(svg)
  triggerDownload(new Blob([svgString], { type: 'image/svg+xml' }), filename)
}

export function downloadPng(svg: SVGSVGElement, filename: string, pixelsPerCm = 4): Promise<void> {
  return new Promise((resolve, reject) => {
    const svgString = serializeSvg(svg)
    const vb = svg.viewBox.baseVal
    const width = Math.round(vb.width * pixelsPerCm)
    const height = Math.round(vb.height * pixelsPerCm)

    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG export failed'))
          return
        }
        triggerDownload(blob, filename)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to rasterise plan'))
    }
    img.src = url
  })
}

/** Plain-text/markdown layout summary: every item, its size, and distance from the room's north and west reference walls. */
export function layoutSummaryText(room: RoomDef, layoutName: string, items: FurnitureItem[]): string {
  const lines = [`# ${room.name} — ${layoutName}`, '', `| Item | W x D | From west wall | From north wall | Rotation |`, `|---|---|---|---|---|`]
  for (const item of items) {
    const bounds = polygonBounds(itemFootprintPolygon(item))
    const fromWest = bounds.x - room.rect.x
    const fromNorth = bounds.y - room.rect.y
    lines.push(`| ${item.name} | ${formatCm(item.w)} x ${formatCm(item.d)} | ${formatCm(fromWest)} | ${formatCm(fromNorth)} | ${item.rotation}° |`)
  }
  return lines.join('\n')
}
