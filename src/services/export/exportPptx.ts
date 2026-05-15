import PptxGenJS from 'pptxgenjs'
import { deckRepository } from '../storage/deckRepository'
import { slideRepository } from '../storage/slideRepository'
import { assetRepository } from '../storage/assetRepository'

export interface ExportProgress {
  current: number
  total: number
}

export async function exportPptx(
  deckId: string,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const deck = await deckRepository.getById(deckId)
  if (!deck) {
    throw new Error('演示文稿不存在')
  }

  if (deck.slides.length === 0) {
    throw new Error('演示文稿没有页面')
  }

  const total = deck.slides.length
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'CUSTOM', width: 10, height: 5.625 })
  pptx.layout = 'CUSTOM'

  let current = 0
  for (const slideId of deck.slides) {
    const slideRecord = await slideRepository.getById(slideId)
    if (!slideRecord) { current++; continue }

    const asset = await assetRepository.get(slideRecord.currentAssetId)
    if (!asset) { current++; continue }

    const dataUrl = await blobToDataUrl(asset.blob)
    const slide = pptx.addSlide()
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    })
    current++
    onProgress?.({ current, total })
  }

  return await pptx.write({ outputType: 'blob' }) as Blob
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(blob)
  })
}
