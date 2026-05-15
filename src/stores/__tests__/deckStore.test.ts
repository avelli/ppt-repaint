import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDeckStore } from '../deckStore'

vi.mock('../../services/storage/deckRepository', () => ({
  deckRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../services/storage/slideRepository', () => ({
  slideRepository: {
    getByDeckId: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

function resetStore() {
  useDeckStore.setState(useDeckStore.getInitialState())
}

describe('deckStore', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('decks 为空数组', () => {
      expect(useDeckStore.getState().decks).toEqual([])
    })

    it('currentDeckId 为 null', () => {
      expect(useDeckStore.getState().currentDeckId).toBeNull()
    })

    it('slides 为空数组', () => {
      expect(useDeckStore.getState().slides).toEqual([])
    })

    it('isLoading 为 false', () => {
      expect(useDeckStore.getState().isLoading).toBe(false)
    })
  })

  describe('setCurrentDeckId', () => {
    it('设置当前 deck', () => {
      useDeckStore.getState().setCurrentDeckId('deck-1')
      expect(useDeckStore.getState().currentDeckId).toBe('deck-1')
    })
  })

  describe('slides 管理', () => {
    it('setSlides 设置 slide 列表', () => {
      const slides = [
        { id: 's1', deckId: 'd1', pageNumber: 1, title: '标题1' },
        { id: 's2', deckId: 'd1', pageNumber: 2, title: '标题2' },
      ]
      useDeckStore.getState().setSlides(slides)
      expect(useDeckStore.getState().slides).toEqual(slides)
    })

    it('renameSlide 重命名指定 slide', () => {
      useDeckStore.getState().setSlides([
        { id: 's1', deckId: 'd1', pageNumber: 1, title: '旧标题' },
      ])
      useDeckStore.getState().renameSlide('s1', '新标题')
      expect(useDeckStore.getState().slides[0].title).toBe('新标题')
    })

    it('renameSlide 对不存在的 id 无副作用', () => {
      useDeckStore.getState().setSlides([
        { id: 's1', deckId: 'd1', pageNumber: 1, title: '标题' },
      ])
      useDeckStore.getState().renameSlide('nonexistent', '新标题')
      expect(useDeckStore.getState().slides[0].title).toBe('标题')
    })

    it('addSlide 添加新 slide 到列表末尾', () => {
      useDeckStore.getState().setSlides([
        { id: 's1', deckId: 'd1', pageNumber: 1, title: '第一页' },
      ])
      useDeckStore.getState().addSlide({ id: 's2', deckId: 'd1', pageNumber: 2, title: '第二页' })
      const slides = useDeckStore.getState().slides
      expect(slides).toHaveLength(2)
      expect(slides[1].id).toBe('s2')
    })

    it('removeSlide 移除指定 slide', () => {
      useDeckStore.getState().setSlides([
        { id: 's1', deckId: 'd1', pageNumber: 1, title: '第一页' },
        { id: 's2', deckId: 'd1', pageNumber: 2, title: '第二页' },
      ])
      useDeckStore.getState().removeSlide('s1')
      const slides = useDeckStore.getState().slides
      expect(slides).toHaveLength(1)
      expect(slides[0].id).toBe('s2')
    })
  })

  describe('createDeck', () => {
    it('创建 deck 并加入列表', async () => {
      const deck = await useDeckStore.getState().createDeck('测试演示文稿')
      expect(deck.title).toBe('测试演示文稿')
      expect(deck.id).toBeDefined()
      expect(useDeckStore.getState().decks).toHaveLength(1)
    })
  })

  describe('loadDecks', () => {
    it('加载时设置 isLoading', async () => {
      const { deckRepository } = await import('../../services/storage/deckRepository')
      vi.mocked(deckRepository.getAll).mockResolvedValue([
        { id: 'd1', title: 'Deck 1', slides: [], createdAt: 1, updatedAt: 1 },
      ])
      await useDeckStore.getState().loadDecks()
      expect(useDeckStore.getState().decks).toHaveLength(1)
      expect(useDeckStore.getState().isLoading).toBe(false)
    })
  })

  describe('deleteDeck', () => {
    it('删除 deck 后从列表移除', async () => {
      await useDeckStore.getState().createDeck('要删除的')
      const deckId = useDeckStore.getState().decks[0].id
      await useDeckStore.getState().deleteDeck(deckId)
      expect(useDeckStore.getState().decks).toHaveLength(0)
    })

    it('删除当前选中的 deck 时清除 currentDeckId', async () => {
      const deck = await useDeckStore.getState().createDeck('当前')
      useDeckStore.getState().setCurrentDeckId(deck.id)
      await useDeckStore.getState().deleteDeck(deck.id)
      expect(useDeckStore.getState().currentDeckId).toBeNull()
    })
  })
})
