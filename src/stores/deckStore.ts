import { create } from 'zustand'
import type { Deck } from '../types/deck'
import { deckRepository } from '../services/storage/deckRepository'
import { generateId } from '../utils/id'

interface DeckStore {
  decks: Deck[]
  currentDeckId: string | null
  isLoading: boolean

  loadDecks: () => Promise<void>
  createDeck: (title: string, slideIds?: string[]) => Promise<Deck>
  updateDeck: (deck: Deck) => Promise<void>
  deleteDeck: (id: string) => Promise<void>
  setCurrentDeckId: (id: string | null) => void
}

export const useDeckStore = create<DeckStore>()((set) => ({
  decks: [],
  currentDeckId: null,
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
}))
