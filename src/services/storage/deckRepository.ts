import type { Deck } from '../../types/deck'
import { dbTransaction, STORE_DECKS } from './db'

export const deckRepository = {
  getAll(): Promise<Deck[]> {
    return dbTransaction<Deck[]>(STORE_DECKS, 'readonly', (s) => s.getAll())
  },

  getById(id: string): Promise<Deck | undefined> {
    return dbTransaction<Deck | undefined>(STORE_DECKS, 'readonly', (s) => s.get(id))
  },

  create(deck: Deck): Promise<void> {
    return dbTransaction(STORE_DECKS, 'readwrite', (s) => s.add(deck))
      .then(() => undefined)
  },

  update(deck: Deck): Promise<void> {
    return dbTransaction(STORE_DECKS, 'readwrite', (s) => s.put(deck))
      .then(() => undefined)
  },

  delete(id: string): Promise<void> {
    return dbTransaction(STORE_DECKS, 'readwrite', (s) => s.delete(id))
      .then(() => undefined)
  },
}
