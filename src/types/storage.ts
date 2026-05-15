export interface SlideVersionRecord {
  id: string
  assetId: string
  prompt: string
  createdAt: number
}

export interface SlideRecord {
  id: string
  deckId: string
  pageNumber: number
  currentAssetId: string
  title?: string
  versions: SlideVersionRecord[]
}

export interface ThumbnailRecord {
  id: string
  blob: Blob
  width: number
  height: number
}
