import { describe, it, expect, beforeEach, vi } from 'vitest'
import { importImages } from '../importImages'
import { deckRepository } from '../../storage/deckRepository'
import { slideRepository } from '../../storage/slideRepository'
import { assetRepository } from '../../storage/assetRepository'

vi.mock('../../storage/deckRepository', () => ({
  deckRepository: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../storage/slideRepository', () => ({
  slideRepository: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../storage/assetRepository', () => ({
  assetRepository: {
    putWithThumbnail: vi.fn().mockImplementation((asset) => Promise.resolve(asset.id)),
  },
}))

import { generateId } from '../../../utils/id'

vi.mock('../../../utils/id', () => ({
  generateId: vi.fn(),
}))

function createImageFile(name: string, size = 1024, type = 'image/png'): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}

function createNonImageFile(name: string): File {
  return new File(['hello'], name, { type: 'text/plain' })
}

function createOversizedFile(name: string): File {
  const size = 51 * 1024 * 1024 // 51MB
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type: 'image/png' })
}

describe('importImages', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    vi.mocked(generateId)
      .mockReturnValueOnce('deck-001')
      .mockReturnValueOnce('asset-001')
      .mockReturnValueOnce('slide-001')
      .mockReturnValueOnce('version-001')
      .mockReturnValueOnce('asset-002')
      .mockReturnValueOnce('slide-002')
      .mockReturnValueOnce('version-002')

    vi.mocked(assetRepository.putWithThumbnail).mockImplementation(
      (asset) => Promise.resolve(asset.id),
    )

    vi.mocked(deckRepository.create).mockResolvedValue(undefined)
    vi.mocked(slideRepository.create).mockResolvedValue(undefined)

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      close: vi.fn(),
    }))
  })

  describe('参数校验', () => {
    it('空文件数组抛出错误', async () => {
      await expect(importImages([])).rejects.toThrow('至少需要一个图片文件')
    })

    it('非图片文件被过滤，全部无效时抛出错误', async () => {
      const files = [createNonImageFile('doc.txt'), createNonImageFile('data.json')]
      await expect(importImages(files)).rejects.toThrow('没有有效的图片文件')
    })

    it('超过 50MB 的文件被过滤', async () => {
      const files = [createOversizedFile('huge.png')]
      await expect(importImages(files)).rejects.toThrow('没有有效的图片文件')
    })
  })

  describe('正常导入', () => {
    it('单张图片导入返回 deck ID', async () => {
      const files = [createImageFile('slide1.png')]
      const deckId = await importImages(files)
      expect(deckId).toBe('deck-001')
    })

    it('创建 ImageAsset 并存入仓储', async () => {
      const files = [createImageFile('slide1.png', 2048)]

      await importImages(files)

      expect(assetRepository.putWithThumbnail).toHaveBeenCalledTimes(1)
      expect(assetRepository.putWithThumbnail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'asset-001',
          mimeType: 'image/png',
        }),
      )
    })

    it('创建 Deck 记录', async () => {
      const files = [createImageFile('slide1.png')]

      await importImages(files)

      expect(deckRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'deck-001',
          slides: ['slide-001'],
        }),
      )
    })

    it('Deck 标题默认使用第一个文件名（去扩展名）', async () => {
      const files = [createImageFile('我的演示文稿.png')]

      await importImages(files)

      expect(deckRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '我的演示文稿',
        }),
      )
    })

    it('创建 SlideRecord', async () => {
      const files = [createImageFile('slide1.png')]

      await importImages(files)

      expect(slideRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'slide-001',
          deckId: 'deck-001',
          pageNumber: 1,
          currentAssetId: 'asset-001',
          versions: [
            expect.objectContaining({
              id: 'version-001',
              assetId: 'asset-001',
              prompt: '',
            }),
          ],
        }),
      )
    })

    it('多张图片按顺序创建 slides', async () => {
      const files = [
        createImageFile('page1.png'),
        createImageFile('page2.jpg', 1024, 'image/jpeg'),
      ]

      await importImages(files)

      expect(slideRepository.create).toHaveBeenCalledTimes(2)
      expect(slideRepository.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ pageNumber: 1 }),
      )
      expect(slideRepository.create).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ pageNumber: 2 }),
      )
    })

    it('混合有效和无效文件时只处理有效文件', async () => {
      const files = [
        createImageFile('valid.png'),
        createNonImageFile('invalid.txt'),
        createImageFile('also-valid.jpg', 1024, 'image/jpeg'),
      ]

      await importImages(files)

      expect(assetRepository.putWithThumbnail).toHaveBeenCalledTimes(2)
    })
  })

  describe('支持的图片格式', () => {
    const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']

    supportedTypes.forEach((type) => {
      it(`接受 ${type}`, async () => {
        const ext = type.split('/')[1]
        const files = [createImageFile(`test.${ext}`, 1024, type)]
        await expect(importImages(files)).resolves.toBeDefined()
      })
    })
  })

  describe('自定义标题', () => {
    it('传入 title 参数时使用自定义标题', async () => {
      const files = [createImageFile('slide1.png')]

      await importImages(files, { title: '自定义标题' })

      expect(deckRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: '自定义标题' }),
      )
    })
  })
})
