import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImageEditService } from '../imageEditService'
import type { ImageProvider, ImageResult } from '../imageProvider.types'

function createMockProvider(result?: Partial<ImageResult>): ImageProvider {
  return {
    name: 'mock',
    editImage: vi.fn().mockResolvedValue({
      blob: new Blob([new Uint8Array(16)], { type: 'image/png' }),
      mimeType: 'image/png',
      revisedPrompt: '改进后的提示词',
      ...result,
    }),
  }
}

function createMockAssetRepository() {
  return {
    put: vi.fn().mockResolvedValue(undefined),
    putWithThumbnail: vi.fn().mockResolvedValue('asset-id-123'),
    get: vi.fn().mockResolvedValue(undefined),
  }
}

function createMockSlideRepository() {
  return {
    getById: vi.fn().mockResolvedValue({
      id: 'slide-1',
      deckId: 'deck-1',
      pageNumber: 1,
      currentAssetId: 'old-asset-id',
      versions: [],
    }),
    update: vi.fn().mockResolvedValue(undefined),
  }
}

function createImageBlob(): Blob {
  return new Blob([new Uint8Array(32)], { type: 'image/png' })
}

describe('ImageEditService', () => {
  let mockProvider: ImageProvider
  let mockAssetRepo: ReturnType<typeof createMockAssetRepository>
  let mockSlideRepo: ReturnType<typeof createMockSlideRepository>
  let service: ImageEditService

  beforeEach(() => {
    mockProvider = createMockProvider()
    mockAssetRepo = createMockAssetRepository()
    mockSlideRepo = createMockSlideRepository()
    service = new ImageEditService({
      provider: mockProvider,
      assetRepository: mockAssetRepo,
      slideRepository: mockSlideRepo,
    })
  })

  describe('editSlideImage', () => {
    it('调用 provider.editImage 并传递正确参数', async () => {
      const image = createImageBlob()

      await service.editSlideImage({
        slideId: 'slide-1',
        image,
        prompt: '让背景变蓝',
      })

      expect(mockProvider.editImage).toHaveBeenCalledWith(
        image,
        '让背景变蓝',
        expect.objectContaining({}),
      )
    })

    it('传递 mask 给 provider', async () => {
      const image = createImageBlob()
      const mask = new Blob([new Uint8Array(8)], { type: 'image/png' })

      await service.editSlideImage({
        slideId: 'slide-1',
        image,
        prompt: '修改选中区域',
        mask,
      })

      expect(mockProvider.editImage).toHaveBeenCalledWith(
        image,
        '修改选中区域',
        expect.objectContaining({ mask }),
      )
    })

    it('传递 signal 给 provider', async () => {
      const image = createImageBlob()
      const controller = new AbortController()

      await service.editSlideImage({
        slideId: 'slide-1',
        image,
        prompt: '测试',
        signal: controller.signal,
      })

      expect(mockProvider.editImage).toHaveBeenCalledWith(
        image,
        '测试',
        expect.objectContaining({ signal: controller.signal }),
      )
    })

    it('将结果 Blob 存入 assetRepository', async () => {
      const image = createImageBlob()

      await service.editSlideImage({
        slideId: 'slide-1',
        image,
        prompt: '测试',
      })

      expect(mockAssetRepo.putWithThumbnail).toHaveBeenCalledWith(
        expect.objectContaining({
          blob: expect.any(Blob),
          mimeType: 'image/png',
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      )
    })

    it('更新 slide 记录添加新版本', async () => {
      const image = createImageBlob()

      await service.editSlideImage({
        slideId: 'slide-1',
        image,
        prompt: '让背景变蓝',
      })

      expect(mockSlideRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'slide-1',
          currentAssetId: 'asset-id-123',
          versions: expect.arrayContaining([
            expect.objectContaining({
              prompt: '让背景变蓝',
              assetId: 'asset-id-123',
            }),
          ]),
        }),
      )
    })

    it('返回编辑结果包含 assetId 和 revisedPrompt', async () => {
      const image = createImageBlob()

      const result = await service.editSlideImage({
        slideId: 'slide-1',
        image,
        prompt: '测试',
      })

      expect(result.assetId).toBe('asset-id-123')
      expect(result.revisedPrompt).toBe('改进后的提示词')
    })

    it('provider 抛出错误时向上传播', async () => {
      const failProvider: ImageProvider = {
        name: 'fail',
        editImage: vi.fn().mockRejectedValue(new Error('API 调用失败')),
      }
      const failService = new ImageEditService({
        provider: failProvider,
        assetRepository: mockAssetRepo,
        slideRepository: mockSlideRepo,
      })
      const image = createImageBlob()

      await expect(
        failService.editSlideImage({ slideId: 'slide-1', image, prompt: '测试' }),
      ).rejects.toThrow('API 调用失败')

      expect(mockAssetRepo.putWithThumbnail).not.toHaveBeenCalled()
      expect(mockSlideRepo.update).not.toHaveBeenCalled()
    })

    it('slide 不存在时抛出错误', async () => {
      mockSlideRepo.getById.mockResolvedValue(undefined)
      const image = createImageBlob()

      await expect(
        service.editSlideImage({ slideId: 'nonexistent', image, prompt: '测试' }),
      ).rejects.toThrow()
    })

    it('保留已有版本历史', async () => {
      mockSlideRepo.getById.mockResolvedValue({
        id: 'slide-1',
        deckId: 'deck-1',
        pageNumber: 1,
        currentAssetId: 'old-asset-id',
        versions: [
          { id: 'v1', assetId: 'asset-v1', prompt: '第一次编辑', createdAt: 1000 },
        ],
      })

      const image = createImageBlob()
      await service.editSlideImage({
        slideId: 'slide-1',
        image,
        prompt: '第二次编辑',
      })

      const updateCall = mockSlideRepo.update.mock.calls[0][0]
      expect(updateCall.versions).toHaveLength(2)
      expect(updateCall.versions[0].prompt).toBe('第一次编辑')
      expect(updateCall.versions[1].prompt).toBe('第二次编辑')
    })
  })
})
