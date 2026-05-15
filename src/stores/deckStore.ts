import { create } from 'zustand'
import type { Deck } from '../types/deck'
import type { SlideRecord } from '../types/storage'
import { deckRepository } from '../services/storage/deckRepository'
import { slideRepository } from '../services/storage/slideRepository'
import { assetRepository } from '../services/storage/assetRepository'
import { generateId } from '../utils/id'

export interface SlideInfo {
  id: string
  deckId: string
  pageNumber: number
  title: string
  thumbnailUrl?: string
  imageUrl?: string
  currentAssetId?: string
}

interface DeckStore {
  decks: Deck[]
  currentDeckId: string | null
  slides: SlideInfo[]
  isLoading: boolean

  loadDecks: () => Promise<void>
  createDeck: (title: string, slideIds?: string[]) => Promise<Deck>
  updateDeck: (deck: Deck) => Promise<void>
  deleteDeck: (id: string) => Promise<void>
  setCurrentDeckId: (id: string | null) => void
  loadSlidesForDeck: (deckId: string) => Promise<void>
  setSlides: (slides: SlideInfo[]) => void
  addSlide: (slide: SlideInfo) => void
  insertSlideAfter: (afterIndex: number, slide: SlideInfo) => void
  removeSlide: (id: string) => void
  renameSlide: (id: string, title: string) => void
  loadSlideImage: (slideId: string) => Promise<string | undefined>
  selectSlideCandidate: (slideId: string, assetId: string) => Promise<void>
  reorderSlides: (fromIndex: number, toIndex: number) => Promise<void>
  getOriginalAssetId: (slideId: string) => Promise<string | undefined>
  cleanup: () => void
}

const objectUrls = new Set<string>()

function trackUrl(url: string): string {
  objectUrls.add(url)
  return url
}

export const useDeckStore = create<DeckStore>()((set, get) => ({
  decks: [],
  currentDeckId: null,
  slides: [],
  isLoading: false,

  async loadDecks() {
    set({ isLoading: true })
    const decks = await deckRepository.getAll()
    set({ decks, isLoading: false })
  },

  async createDeck(title: string, slideIds: string[] = []) {
    const now = Date.now()
    const deck: Deck = {
      id: generateId(),
      title,
      slides: slideIds,
      createdAt: now,
      updatedAt: now,
    }
    await deckRepository.create(deck)
    set((state) => ({ decks: [...state.decks, deck] }))
    return deck
  },

  async updateDeck(deck: Deck) {
    const updated = { ...deck, updatedAt: Date.now() }
    await deckRepository.update(updated)
    set((state) => ({
      decks: state.decks.map((d) => d.id === updated.id ? updated : d),
    }))
  },

  async deleteDeck(id: string) {
    const slides = await slideRepository.getByDeckId(id)
    for (const slide of slides) {
      for (const version of slide.versions) {
        await assetRepository.delete(version.assetId)
      }
      await slideRepository.delete(slide.id)
    }
    await deckRepository.delete(id)
    set((state) => ({
      decks: state.decks.filter((d) => d.id !== id),
      currentDeckId: state.currentDeckId === id ? null : state.currentDeckId,
      slides: state.currentDeckId === id ? [] : state.slides,
    }))
  },

  setCurrentDeckId(id: string | null) {
    set({ currentDeckId: id })
  },

  async loadSlidesForDeck(deckId: string) {
    set({ isLoading: true })
    const records: SlideRecord[] = await slideRepository.getByDeckId(deckId)
    records.sort((a, b) => a.pageNumber - b.pageNumber)

    const slides: SlideInfo[] = await Promise.all(
      records.map(async (record) => {
        let thumbnailUrl: string | undefined
        const thumb = await assetRepository.getThumbnail(record.currentAssetId)
        if (thumb) {
          thumbnailUrl = trackUrl(URL.createObjectURL(thumb.blob))
        }

        return {
          id: record.id,
          deckId: record.deckId,
          pageNumber: record.pageNumber,
          title: record.title ?? `第 ${record.pageNumber} 页`,
          thumbnailUrl,
          currentAssetId: record.currentAssetId,
        }
      }),
    )

    set({ slides, isLoading: false })
  },

  setSlides(slides: SlideInfo[]) {
    set({ slides })
  },

  addSlide(slide: SlideInfo) {
    set((state) => ({ slides: [...state.slides, slide] }))
  },

  insertSlideAfter(afterIndex: number, slide: SlideInfo) {
    set((state) => {
      const newSlides = [...state.slides]
      newSlides.splice(afterIndex + 1, 0, slide)
      return { slides: newSlides.map((s, i) => ({ ...s, pageNumber: i + 1 })) }
    })
  },

  removeSlide(id: string) {
    set((state) => ({ slides: state.slides.filter((s) => s.id !== id) }))
  },

  renameSlide(id: string, title: string) {
    set((state) => ({
      slides: state.slides.map((s) => s.id === id ? { ...s, title } : s),
    }))
    slideRepository.getById(id).then((record) => {
      if (record) {
        slideRepository.update({ ...record, title })
      }
    })
  },

  async loadSlideImage(slideId: string) {
    const slide = get().slides.find((s) => s.id === slideId)
    if (!slide?.currentAssetId) return undefined

    if (slide.imageUrl) return slide.imageUrl

    const asset = await assetRepository.get(slide.currentAssetId)
    if (!asset) return undefined

    const url = trackUrl(URL.createObjectURL(asset.blob))
    set((state) => ({
      slides: state.slides.map((s) =>
        s.id === slideId ? { ...s, imageUrl: url } : s,
      ),
    }))
    return url
  },

  async selectSlideCandidate(slideId: string, assetId: string) {
    const record = await slideRepository.getById(slideId)
    if (!record) return

    await slideRepository.update({ ...record, currentAssetId: assetId })

    const asset = await assetRepository.get(assetId)
    if (!asset) return

    const imageUrl = trackUrl(URL.createObjectURL(asset.blob))
    let thumbnailUrl: string | undefined
    const thumb = await assetRepository.getThumbnail(assetId)
    if (thumb) {
      thumbnailUrl = trackUrl(URL.createObjectURL(thumb.blob))
    }

    set((state) => ({
      slides: state.slides.map((s) =>
        s.id === slideId ? { ...s, currentAssetId: assetId, imageUrl, thumbnailUrl } : s,
      ),
    }))
  },

  async reorderSlides(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return

    const { slides, currentDeckId, decks } = get()
    const reordered = [...slides]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    const updated = reordered.map((s, i) => ({ ...s, pageNumber: i + 1 }))
    set({ slides: updated })

    if (!currentDeckId) return
    const deck = decks.find((d) => d.id === currentDeckId)
    if (deck) {
      const newDeck = { ...deck, slides: updated.map((s) => s.id), updatedAt: Date.now() }
      await deckRepository.update(newDeck)
      set((state) => ({
        decks: state.decks.map((d) => d.id === newDeck.id ? newDeck : d),
      }))
    }

    for (const slide of updated) {
      const record = await slideRepository.getById(slide.id)
      if (record && record.pageNumber !== slide.pageNumber) {
        await slideRepository.update({ ...record, pageNumber: slide.pageNumber })
      }
    }
  },

  async getOriginalAssetId(slideId: string) {
    const record = await slideRepository.getById(slideId)
    if (!record || record.versions.length === 0) return undefined
    return record.versions[0].assetId
  },

  cleanup() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.clear()
  },
}))
