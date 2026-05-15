import type { ImageAsset } from '../../types/image'
import type { SlideRecord } from '../../types/storage'
import type { Deck } from '../../types/deck'
import { generateId } from '../../utils/id'
import { deckRepository } from '../storage/deckRepository'
import { slideRepository } from '../storage/slideRepository'
import { assetRepository } from '../storage/assetRepository'

export const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
])

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface ImportImagesOptions {
  title?: string
}

export async function importImages(
  files: File[],
  options?: ImportImagesOptions,
): Promise<string> {
  if (files.length === 0) {
    throw new Error('至少需要一个图片文件')
  }

  const validFiles = files.filter(
    (f) => SUPPORTED_IMAGE_TYPES.has(f.type) && f.size <= MAX_FILE_SIZE,
  )

  if (validFiles.length === 0) {
    throw new Error('没有有效的图片文件')
  }

  const deckId = generateId()
  const slideIds: string[] = []

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i]

    const assetId = generateId()
    const { width, height } = await getImageDimensions(file)

    const asset: ImageAsset = {
      id: assetId,
      blob: file,
      mimeType: file.type,
      width,
      height,
    }
    await assetRepository.putWithThumbnail(asset)

    const slideId = generateId()
    const versionId = generateId()

    const record: SlideRecord = {
      id: slideId,
      deckId,
      pageNumber: i + 1,
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

  const title = options?.title ?? deriveTitle(validFiles[0].name)
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

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  bitmap.close()
  return { width, height }
}
