import { describe, it, expect, beforeEach, vi } from 'vitest'
import { importPdf } from '../importPdf'
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

const mockGetPage = vi.fn()
const mockGetDocument = vi.fn()

vi.mock('pdfjs-dist', () => ({
  getDocument: (...args: unknown[]) => ({ promise: mockGetDocument(...args) }),
  GlobalWorkerOptions: { workerSrc: '' },
}))

function createPdfFile(name = 'presentation.pdf', size = 2048): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type: 'application/pdf' })
}

function createMockPage(width = 1920, height = 1080) {
  const mockCanvas = {
    getContext: vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    }),
    toBlob: vi.fn((cb: (blob: Blob) => void) => {
      cb(new Blob(['fake-image'], { type: 'image/png' }))
    }),
    width: 0,
    height: 0,
  }

  vi.stubGlobal('document', {
    createElement: vi.fn().mockReturnValue(mockCanvas),
  })

  return {
    getViewport: vi.fn().mockReturnValue({ width, height }),
    render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
    cleanup: vi.fn(),
  }
}

describe('importPdf', () => {
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
  })

  describe('参数校验', () => {
    it('非 PDF 文件抛出错误', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      await expect(importPdf(file)).rejects.toThrow('请上传 PDF 文件')
    })

    it('超过 200MB 的文件抛出错误', async () => {
      const size = 201 * 1024 * 1024
      const buffer = new ArrayBuffer(size)
      const file = new File([buffer], 'huge.pdf', { type: 'application/pdf' })
      await expect(importPdf(file)).rejects.toThrow('文件大小超过 200MB 限制')
    })
  })

  describe('正常导入', () => {
    it('单页 PDF 返回 deck ID', async () => {
      const page = createMockPage()
      mockGetPage.mockResolvedValue(page)
      mockGetDocument.mockResolvedValue({
        numPages: 1,
        getPage: mockGetPage,
      })

      const file = createPdfFile()
      const deckId = await importPdf(file)
      expect(deckId).toBe('deck-001')
    })

    it('创建 Deck 记录，标题取自文件名', async () => {
      const page = createMockPage()
      mockGetPage.mockResolvedValue(page)
      mockGetDocument.mockResolvedValue({
        numPages: 1,
        getPage: mockGetPage,
      })

      const file = createPdfFile('我的演示.pdf')
      await importPdf(file)

      expect(deckRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'deck-001',
          title: '我的演示',
          slides: ['slide-001'],
        }),
      )
    })

    it('多页 PDF 按顺序创建 slides', async () => {
      const page1 = createMockPage()
      const page2 = createMockPage(1280, 720)
      mockGetPage
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2)
      mockGetDocument.mockResolvedValue({
        numPages: 2,
        getPage: mockGetPage,
      })

      const file = createPdfFile()
      await importPdf(file)

      expect(slideRepository.create).toHaveBeenCalledTimes(2)
      expect(slideRepository.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ pageNumber: 1 }),
      )
      expect(slideRepository.create).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ pageNumber: 2 }),
      )
    })

    it('每页创建 ImageAsset 并存入仓储', async () => {
      const page = createMockPage()
      mockGetPage.mockResolvedValue(page)
      mockGetDocument.mockResolvedValue({
        numPages: 1,
        getPage: mockGetPage,
      })

      const file = createPdfFile()
      await importPdf(file)

      expect(assetRepository.putWithThumbnail).toHaveBeenCalledTimes(1)
      expect(assetRepository.putWithThumbnail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'asset-001',
          mimeType: 'image/png',
        }),
      )
    })

    it('支持自定义标题', async () => {
      const page = createMockPage()
      mockGetPage.mockResolvedValue(page)
      mockGetDocument.mockResolvedValue({
        numPages: 1,
        getPage: mockGetPage,
      })

      const file = createPdfFile()
      await importPdf(file, { title: '自定义标题' })

      expect(deckRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: '自定义标题' }),
      )
    })

    it('渲染使用 scale=2 以获得高清图片', async () => {
      const page = createMockPage(960, 540)
      mockGetPage.mockResolvedValue(page)
      mockGetDocument.mockResolvedValue({
        numPages: 1,
        getPage: mockGetPage,
      })

      const file = createPdfFile()
      await importPdf(file)

      expect(page.getViewport).toHaveBeenCalledWith({ scale: 2 })
    })
  })
})
