import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { ImageAsset } from '../../types/image'
import type { SlideRecord } from '../../types/storage'
import type { Deck } from '../../types/deck'
import { generateId } from '../../utils/id'
import { deckRepository } from '../storage/deckRepository'
import { slideRepository } from '../storage/slideRepository'
import { assetRepository } from '../storage/assetRepository'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

const MAX_PDF_SIZE = 200 * 1024 * 1024 // 200MB
const RENDER_SCALE = 2

export interface ImportPdfOptions {
  title?: string
}

export async function importPdf(
  file: File,
  options?: ImportPdfOptions,
): Promise<string> {
  if (file.type !== 'application/pdf') {
    throw new Error('请上传 PDF 文件')
  }

  if (file.size > MAX_PDF_SIZE) {
    throw new Error('文件大小超过 200MB 限制')
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise

  const deckId = generateId()
  const slideIds: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: RENDER_SCALE })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise

    const blob = await canvasToBlob(canvas)
    page.cleanup()

    const assetId = generateId()
    const asset: ImageAsset = {
      id: assetId,
      blob,
      mimeType: 'image/png',
      width: viewport.width,
      height: viewport.height,
    }
    await assetRepository.putWithThumbnail(asset)

    const slideId = generateId()
    const versionId = generateId()
    const record: SlideRecord = {
      id: slideId,
      deckId,
      pageNumber: pageNum,
      currentAssetId: assetId,
      versions: [{
        id: versionId,
        assetId,
        prompt: '',
        createdAt: Date.now(),
      }],
    }
    await slideRepository.create(record)
    slideIds.push(slideId)
  }

  const title = options?.title ?? deriveTitle(file.name)
  const now = Date.now()
  const deck: Deck = {
    id: deckId,
    title,
    slides: slideIds,
    createdAt: now,
    updatedAt: now,
  }
  await deckRepository.create(deck)

  return deckId
}

function deriveTitle(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.slice(0, lastDot) : filename
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob 失败'))
    }, 'image/png')
  })
}
