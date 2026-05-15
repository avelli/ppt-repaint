import { create } from 'zustand'
import type { Deck } from '../types/deck'
import { deckRepository } from '../services/storage/deckRepository'
import { generateId } from '../utils/id'

export interface SlideInfo {
  id: string
  deckId: string
  pageNumber: number
  title: string
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
  setSlides: (slides: SlideInfo[]) => void
  addSlide: (slide: SlideInfo) => void
  removeSlide: (id: string) => void
  renameSlide: (id: string, title: string) => void
}

export const useDeckStore = create<DeckStore>()((set) => ({
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
    await deckRepository.delete(id)
    set((state) => ({
      decks: state.decks.filter((d) => d.id !== id),
      currentDeckId: state.currentDeckId === id ? null : state.currentDeckId,
    }))
  },

  setCurrentDeckId(id: string | null) {
    set({ currentDeckId: id })
  },

  setSlides(slides: SlideInfo[]) {
    set({ slides })
  },

  addSlide(slide: SlideInfo) {
    set((state) => ({ slides: [...state.slides, slide] }))
  },

  removeSlide(id: string) {
    set((state) => ({ slides: state.slides.filter((s) => s.id !== id) }))
  },

  renameSlide(id: string, title: string) {
    set((state) => ({
      slides: state.slides.map((s) => s.id === id ? { ...s, title } : s),
    }))
  },
}))
