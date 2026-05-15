import type { Slide, SlideVersion } from '../../types/slide'
import type { SlideRecord, SlideVersionRecord } from '../../types/storage'
import { dbTransaction, dbIndexQuery, STORE_SLIDES } from './db'

export function toSlide(record: SlideRecord): Slide {
  return {
    id: record.id,
    deckId: record.deckId,
    pageNumber: record.pageNumber,
    imageUrl: '',
    versions: record.versions.map(toSlideVersion),
  }
}

function toSlideVersion(record: SlideVersionRecord): SlideVersion {
  return {
    id: record.id,
    imageUrl: '',
    prompt: record.prompt,
    createdAt: record.createdAt,
  }
}

export function toSlideRecord(
  slide: Slide,
  currentAssetId: string,
  versionAssetIds: Map<string, string>,
): SlideRecord {
  return {
    id: slide.id,
    deckId: slide.deckId,
    pageNumber: slide.pageNumber,
    currentAssetId,
    versions: slide.versions.map((v: SlideVersion) => ({
      id: v.id,
      assetId: versionAssetIds.get(v.id) ?? '',
      prompt: v.prompt,
      createdAt: v.createdAt,
    })),
  }
}

export const slideRepository = {
  getAll(): Promise<SlideRecord[]> {
    return dbTransaction<SlideRecord[]>(STORE_SLIDES, 'readonly', (s) => s.getAll())
  },

  getById(id: string): Promise<SlideRecord | undefined> {
    return dbTransaction<SlideRecord | undefined>(STORE_SLIDES, 'readonly', (s) => s.get(id))
  },

  getByDeckId(deckId: string): Promise<SlideRecord[]> {
    return dbIndexQuery<SlideRecord>(STORE_SLIDES, 'deckId', deckId)
  },

  create(record: SlideRecord): Promise<void> {
    return dbTransaction(STORE_SLIDES, 'readwrite', (s) => s.add(record))
      .then(() => undefined)
  },

  update(record: SlideRecord): Promise<void> {
    return dbTransaction(STORE_SLIDES, 'readwrite', (s) => s.put(record))
      .then(() => undefined)
  },

  delete(id: string): Promise<void> {
    return dbTransaction(STORE_SLIDES, 'readwrite', (s) => s.delete(id))
      .then(() => undefined)
  },
}
