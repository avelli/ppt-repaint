import { create } from 'zustand'

interface DeckStore {}

export const useDeckStore = create<DeckStore>()(() => ({}))
