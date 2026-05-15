import PptxGenJS from 'pptxgenjs'
import { deckRepository } from '../storage/deckRepository'
import { slideRepository } from '../storage/slideRepository'
import { assetRepository } from '../storage/assetRepository'

export async function exportPptx(deckId: string): Promise<Blob> {
  const deck = await deckRepository.getById(deckId)
  if (!deck) {
    throw new Error('演示文稿不存在')
  }

  if (deck.slides.length === 0) {
    throw new Error('演示文稿没有页面')
  }

  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'CUSTOM', width: 10, height: 5.625 })
  pptx.layout = 'CUSTOM'

  for (const slideId of deck.slides) {
    const slideRecord = await slideRepository.getById(slideId)
    if (!slideRecord) continue

    const asset = await assetRepository.get(slideRecord.currentAssetId)
    if (!asset) continue

    const dataUrl = await blobToDataUrl(asset.blob)
    const slide = pptx.addSlide()
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    })
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
