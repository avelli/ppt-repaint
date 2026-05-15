const DB_NAME = 'oh-my-ppt'
const DB_VERSION = 1

export const STORE_DECKS = 'decks'
export const STORE_SLIDES = 'slides'
export const STORE_ASSETS = 'assets'
export const STORE_THUMBNAILS = 'thumbnails'

let dbInstance: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_DECKS)) {
        db.createObjectStore(STORE_DECKS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_SLIDES)) {
        const slideStore = db.createObjectStore(STORE_SLIDES, { keyPath: 'id' })
        slideStore.createIndex('deckId', 'deckId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_THUMBNAILS)) {
        db.createObjectStore(STORE_THUMBNAILS, { keyPath: 'id' })
      }
    }

    req.onsuccess = () => {
      dbInstance = req.result
      dbInstance.onclose = () => { dbInstance = null }
      resolve(dbInstance)
    }

    req.onerror = () => reject(req.error)
  })
}

export function dbTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const req = fn(store)
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      }),
  )
}

export function dbMultiTransaction(
  storeNames: string[],
  mode: IDBTransactionMode,
  fn: (getStore: (name: string) => IDBObjectStore) => void,
): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeNames, mode)
        fn((name) => tx.objectStore(name))
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }),
  )
}

export function dbIndexQuery<T>(
  storeName: string,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  return openDB().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const index = store.index(indexName)
        const req = index.getAll(key)
        req.onsuccess = () => resolve(req.result as T[])
        req.onerror = () => reject(req.error)
      }),
  )
}
