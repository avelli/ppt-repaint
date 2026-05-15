import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportPptx } from '../exportPptx'
import { deckRepository } from '../../storage/deckRepository'
import { slideRepository } from '../../storage/slideRepository'
import { assetRepository } from '../../storage/assetRepository'

vi.mock('../../storage/deckRepository', () => ({
  deckRepository: {
    getById: vi.fn(),
  },
}))

vi.mock('../../storage/slideRepository', () => ({
  slideRepository: {
    getById: vi.fn(),
  },
}))

vi.mock('../../storage/assetRepository', () => ({
  assetRepository: {
    get: vi.fn(),
  },
}))

const mockAddImage = vi.fn()
const mockAddSlide = vi.fn(() => ({ addImage: mockAddImage }))
const mockDefineLayout = vi.fn()
const mockWrite = vi.fn()

vi.mock('pptxgenjs', () => {
  return {
    default: class MockPptxGenJS {
      layout = ''
      defineLayout = mockDefineLayout
      addSlide = mockAddSlide
      write = mockWrite
    },
  }
})

describe('exportPptx', () => {
  beforeEach(() => {
    vi.mocked(deckRepository.getById).mockReset()
    vi.mocked(slideRepository.getById).mockReset()
    vi.mocked(assetRepository.get).mockReset()
    mockAddImage.mockReset()
    mockAddSlide.mockReset().mockReturnValue({ addImage: mockAddImage })
    mockDefineLayout.mockReset()
    mockWrite.mockReset().mockResolvedValue(new Blob(['fake-pptx'], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    }))

    vi.stubGlobal('FileReader', class {
      result: string | null = null
      onload: (() => void) | null = null
      readAsDataURL() {
        this.result = 'data:image/png;base64,fakedata'
        Promise.resolve().then(() => this.onload?.())
      }
    })
  })

  describe('参数校验', () => {
    it('deck 不存在时抛出错误', async () => {
      vi.mocked(deckRepository.getById).mockResolvedValue(undefined)
      await expect(exportPptx('non-existent')).rejects.toThrow('演示文稿不存在')
    })

    it('deck 没有 slides 时抛出错误', async () => {
      vi.mocked(deckRepository.getById).mockResolvedValue({
        id: 'deck-001',
        title: '测试',
        slides: [],
        createdAt: 0,
        updatedAt: 0,
      })
      await expect(exportPptx('deck-001')).rejects.toThrow('演示文稿没有页面')
    })
  })

  describe('正常导出', () => {
    const mockDeck = {
      id: 'deck-001',
      title: '我的演示',
      slides: ['slide-001', 'slide-002'],
      createdAt: 0,
      updatedAt: 0,
    }

    const mockSlide1 = {
      id: 'slide-001',
      deckId: 'deck-001',
      pageNumber: 1,
      currentAssetId: 'asset-001',
      versions: [],
    }

    const mockSlide2 = {
      id: 'slide-002',
      deckId: 'deck-001',
      pageNumber: 2,
      currentAssetId: 'asset-002',
      versions: [],
    }

    const mockAsset1 = {
      id: 'asset-001',
      blob: new Blob(['img1'], { type: 'image/png' }),
      mimeType: 'image/png',
      width: 1920,
      height: 1080,
    }

    const mockAsset2 = {
      id: 'asset-002',
      blob: new Blob(['img2'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
    }

    beforeEach(() => {
      vi.mocked(deckRepository.getById).mockResolvedValue(mockDeck)
      vi.mocked(slideRepository.getById)
        .mockResolvedValueOnce(mockSlide1)
        .mockResolvedValueOnce(mockSlide2)
      vi.mocked(assetRepository.get)
        .mockResolvedValueOnce(mockAsset1)
        .mockResolvedValueOnce(mockAsset2)
    })

    it('返回 Blob 对象', async () => {
      const result = await exportPptx('deck-001')
      expect(result).toBeInstanceOf(Blob)
    })

    it('为每页 slide 添加一张幻灯片', async () => {
      await exportPptx('deck-001')
      expect(mockAddSlide).toHaveBeenCalledTimes(2)
    })

    it('每页添加全屏背景图', async () => {
      await exportPptx('deck-001')
      expect(mockAddImage).toHaveBeenCalledTimes(2)
      expect(mockAddImage).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
        }),
      )
    })

    it('图片使用 base64 data 格式', async () => {
      await exportPptx('deck-001')
      expect(mockAddImage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.stringContaining('data:'),
        }),
      )
    })

    it('slide 对应的 asset 不存在时跳过该页', async () => {
      vi.mocked(assetRepository.get)
        .mockReset()
        .mockResolvedValueOnce(mockAsset1)
        .mockResolvedValueOnce(undefined)

      await exportPptx('deck-001')
      expect(mockAddSlide).toHaveBeenCalledTimes(1)
    })
  })
})
