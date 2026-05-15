import { generateId } from '../../utils/id'
import type { ImageProvider, ImageEditOptions } from './imageProvider.types'
import type { ImageAsset } from '../../types/image'
import type { SlideRecord, SlideVersionRecord } from '../../types/storage'

export interface EditSlideImageParams {
  slideId: string
  image: Blob
  prompt: string
  mask?: Blob
  size?: string
  quality?: string
  outputFormat?: 'png' | 'jpeg' | 'webp'
  moderation?: 'auto' | 'low'
  signal?: AbortSignal
}

export interface EditSlideImageResult {
  assetId: string
  revisedPrompt?: string
}

interface AssetRepositoryLike {
  putWithThumbnail(asset: ImageAsset): Promise<string>
}

interface SlideRepositoryLike {
  getById(id: string): Promise<SlideRecord | undefined>
  update(record: SlideRecord): Promise<void>
}

export interface ImageEditServiceDeps {
  provider: ImageProvider
  assetRepository: AssetRepositoryLike
  slideRepository: SlideRepositoryLike
}

const DEFAULT_WIDTH = 1536
const DEFAULT_HEIGHT = 1024

export class ImageEditService {
  private provider: ImageProvider
  private assetRepository: AssetRepositoryLike
  private slideRepository: SlideRepositoryLike

  constructor(deps: ImageEditServiceDeps) {
    this.provider = deps.provider
    this.assetRepository = deps.assetRepository
    this.slideRepository = deps.slideRepository
  }

  async editSlideImage(params: EditSlideImageParams): Promise<EditSlideImageResult> {
    const { slideId, image, prompt, mask, size, quality, outputFormat, moderation, signal } = params

    const slide = await this.slideRepository.getById(slideId)
    if (!slide) {
      throw new Error(`Slide ${slideId} 不存在`)
    }

    const editOptions: ImageEditOptions = {}
    if (mask) editOptions.mask = mask
    if (size) editOptions.size = size
    if (quality) editOptions.quality = quality
    if (outputFormat) editOptions.outputFormat = outputFormat
    if (moderation) editOptions.moderation = moderation
    if (signal) editOptions.signal = signal

    const result = await this.provider.editImage(image, prompt, editOptions)

    const asset: ImageAsset = {
      id: generateId(),
      blob: result.blob,
      mimeType: result.mimeType,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    }

    const assetId = await this.assetRepository.putWithThumbnail(asset)

    const newVersion: SlideVersionRecord = {
      id: generateId(),
      assetId,
      prompt,
      createdAt: Date.now(),
    }

    const updatedSlide: SlideRecord = {
      ...slide,
      versions: [...slide.versions, newVersion],
    }

    await this.slideRepository.update(updatedSlide)

    return {
      assetId,
      revisedPrompt: result.revisedPrompt,
    }
  }
}
