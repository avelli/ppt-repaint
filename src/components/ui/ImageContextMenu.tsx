import { useEffect, useState, useRef, useCallback } from 'react'
import { useDeckStore } from '../../stores/deckStore'
import { useEditorStore } from '../../stores/editorStore'
import { assetRepository } from '../../services/storage/assetRepository'
import { slideRepository } from '../../services/storage/slideRepository'

type MenuArea = 'sidebar' | 'canvas' | 'history'

interface MenuInfo {
  src: string
  slideId?: string
  assetId?: string
  area: MenuArea
  x: number
  y: number
}

export function ImageContextMenu() {
  const [menuInfo, setMenuInfo] = useState<MenuInfo | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const removeSlide = useDeckStore((s) => s.removeSlide)
  const loadSlidesForDeck = useDeckStore((s) => s.loadSlidesForDeck)
  const currentDeckId = useDeckStore((s) => s.currentDeckId)
  const setCurrentSlideId = useEditorStore((s) => s.setCurrentSlideId)
  const currentSlideId = useEditorStore((s) => s.currentSlideId)
  const loadSlideImage = useDeckStore((s) => s.loadSlideImage)

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const imgEl = target.closest('[data-ctx-area]') as HTMLElement | null
      if (!imgEl) return

      const area = imgEl.dataset.ctxArea as MenuArea | undefined
      if (!area) return

      const src = imgEl.dataset.ctxSrc || (imgEl.tagName === 'IMG' ? (imgEl as HTMLImageElement).src : '')
      if (!src) return

      e.preventDefault()
      setMenuInfo({
        src,
        slideId: imgEl.dataset.ctxSlideId,
        assetId: imgEl.dataset.ctxAssetId,
        area,
        x: e.clientX,
        y: e.clientY,
      })
    }

    window.addEventListener('contextmenu', onContextMenu)
    return () => window.removeEventListener('contextmenu', onContextMenu)
  }, [])

  useEffect(() => {
    if (!menuInfo) return
    const close = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return
      setMenuInfo(null)
    }
    window.addEventListener('mousedown', close, { capture: true })
    window.addEventListener('wheel', close, { capture: true })
    window.addEventListener('scroll', close, { capture: true })
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('mousedown', close, { capture: true })
      window.removeEventListener('wheel', close, { capture: true })
      window.removeEventListener('scroll', close, { capture: true })
      window.removeEventListener('resize', close)
    }
  }, [menuInfo])

  const getImageBlob = useCallback(async (src: string, assetId?: string): Promise<Blob> => {
    if (assetId) {
      const asset = await assetRepository.get(assetId)
      if (asset) return asset.blob
    }
    const res = await fetch(src)
    return res.blob()
  }, [])

  const handleCopy = useCallback(async () => {
    if (!menuInfo) return
    setMenuInfo(null)
    try {
      const blob = await getImageBlob(menuInfo.src, menuInfo.assetId)
      const pngBlob = blob.type === 'image/png' ? blob : await convertToPng(blob)
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ])
    } catch {
      // 静默失败
    }
  }, [menuInfo, getImageBlob])

  const handleDownload = useCallback(async () => {
    if (!menuInfo) return
    setMenuInfo(null)
    try {
      const blob = await getImageBlob(menuInfo.src, menuInfo.assetId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = blob.type.split('/')[1] || 'png'
      a.download = `slide-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // 静默失败
    }
  }, [menuInfo, getImageBlob])

  const handleDelete = useCallback(async () => {
    if (!menuInfo?.slideId) return
    setMenuInfo(null)
    const confirmed = window.confirm('确定要删除这一页吗？')
    if (!confirmed) return

    const slideId = menuInfo.slideId
    const record = await slideRepository.getById(slideId)
    if (record) {
      for (const version of record.versions) {
        await assetRepository.delete(version.assetId)
      }
      await slideRepository.delete(slideId)
    }
    removeSlide(slideId)

    if (currentSlideId === slideId) {
      setCurrentSlideId(null)
    }
    if (currentDeckId) {
      const deck = useDeckStore.getState().decks.find((d) => d.id === currentDeckId)
      if (deck) {
        const { updateDeck } = useDeckStore.getState()
        await updateDeck({
          ...deck,
          slides: deck.slides.filter((sid) => sid !== slideId),
        })
      }
    }
  }, [menuInfo, removeSlide, currentSlideId, setCurrentSlideId, currentDeckId])

  const handleUse = useCallback(async () => {
    if (!menuInfo?.assetId || !currentSlideId) return
    setMenuInfo(null)

    const record = await slideRepository.getById(currentSlideId)
    if (!record) return

    await slideRepository.update({
      ...record,
      currentAssetId: menuInfo.assetId,
    })

    const slides = useDeckStore.getState().slides
    const slide = slides.find((s) => s.id === currentSlideId)
    if (slide) {
      useDeckStore.setState({
        slides: slides.map((s) =>
          s.id === currentSlideId ? { ...s, currentAssetId: menuInfo.assetId, imageUrl: undefined } : s,
        ),
      })
      await loadSlideImage(currentSlideId)
      if (currentDeckId) {
        await loadSlidesForDeck(currentDeckId)
      }
    }
  }, [menuInfo, currentSlideId, loadSlideImage, loadSlidesForDeck, currentDeckId])

  if (!menuInfo) return null

  const MENU_WIDTH = 128
  const items = getMenuItems(menuInfo.area)
  const MENU_HEIGHT = items.length * 36 + 8

  let left = menuInfo.x
  let top = menuInfo.y
  if (left + MENU_WIDTH > window.innerWidth) left -= MENU_WIDTH
  if (top + MENU_HEIGHT > window.innerHeight) top -= MENU_HEIGHT

  const actionMap: Record<string, () => void> = {
    copy: handleCopy,
    download: handleDownload,
    delete: handleDelete,
    use: handleUse,
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-cream-300 py-1 w-[128px] overflow-hidden"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.key}
          onClick={actionMap[item.key]}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
            item.key === 'delete'
              ? 'text-red-600 hover:bg-red-50'
              : 'text-warm-800 hover:bg-cream-100'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}

function getMenuItems(area: MenuArea) {
  const copy = { key: 'copy', label: '复制', icon: <CopyIcon /> }
  const download = { key: 'download', label: '下载', icon: <DownloadIcon /> }
  const del = { key: 'delete', label: '删除', icon: <DeleteIcon /> }
  const use = { key: 'use', label: '使用', icon: <UseIcon /> }

  switch (area) {
    case 'sidebar': return [copy, download, del]
    case 'canvas': return [copy, download]
    case 'history': return [copy, download, use]
  }
}

async function convertToPng(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvas.convertToBlob({ type: 'image/png' })
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function UseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
