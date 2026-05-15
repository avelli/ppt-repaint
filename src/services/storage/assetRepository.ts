import type { ImageAsset } from '../../types/image'
import type { ThumbnailRecord } from '../../types/storage'
import {
  dbTransaction,
  dbMultiTransaction,
  STORE_ASSETS,
  STORE_THUMBNAILS,
} from './db'

const THUMBNAIL_MAX_WIDTH = 300

export const assetRepository = {
  get(id: string): Promise<ImageAsset | undefined> {
    return dbTransaction<ImageAsset | undefined>(
      STORE_ASSETS, 'readonly', (s) => s.get(id),
    )
  },

  getAll(): Promise<ImageAsset[]> {
    return dbTransaction<ImageAsset[]>(
      STORE_ASSETS, 'readonly', (s) => s.getAll(),
    )
  },

  put(asset: ImageAsset): Promise<void> {
    return dbTransaction(
      STORE_ASSETS, 'readwrite', (s) => s.put(asset),
    ).then(() => undefined)
  },

  delete(id: string): Promise<void> {
    return dbMultiTransaction(
      [STORE_ASSETS, STORE_THUMBNAILS],
      'readwrite',
      (getStore) => {
        getStore(STORE_ASSETS).delete(id)
        getStore(STORE_THUMBNAILS).delete(id)
      },
    )
  },

  getThumbnail(id: string): Promise<ThumbnailRecord | undefined> {
    return dbTransaction<ThumbnailRecord | undefined>(
      STORE_THUMBNAILS, 'readonly', (s) => s.get(id),
    )
  },

  putThumbnail(thumbnail: ThumbnailRecord): Promise<void> {
    return dbTransaction(
      STORE_THUMBNAILS, 'readwrite', (s) => s.put(thumbnail),
    ).then(() => undefined)
  },

  async putWithThumbnail(asset: ImageAsset): Promise<string> {
    await this.put(asset)

    const thumbnailBlob = await generateThumbnail(
      asset.blob, asset.width, asset.height,
    )
    if (thumbnailBlob) {
      const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / asset.width)
      await this.putThumbnail({
        id: asset.id,
        blob: thumbnailBlob,
        width: Math.round(asset.width * scale),
        height: Math.round(asset.height * scale),
      })
    }

    return asset.id
  },
}

async function generateThumbnail(
  blob: Blob,
  originalWidth: number,
  originalHeight: number,
): Promise<Blob | null> {
  if (originalWidth <= THUMBNAIL_MAX_WIDTH) return blob

  const scale = THUMBNAIL_MAX_WIDTH / originalWidth
  const targetWidth = Math.round(originalWidth * scale)
  const targetHeight = Math.round(originalHeight * scale)

  const bitmap = await createImageBitmap(blob, {
    resizeWidth: targetWidth,
    resizeHeight: targetHeight,
    resizeQuality: 'medium',
  })

  const canvas = new OffscreenCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return null
  }

  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  return canvas.convertToBlob({ type: 'image/webp', quality: 0.8 })
}
