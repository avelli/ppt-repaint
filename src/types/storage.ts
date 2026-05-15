export interface SlideVersionRecord {
  id: string
  assetId: string
  prompt: string
  createdAt: number
}

export type EditTaskStatus = 'done' | 'generating' | 'error'

export interface EditTaskRecord {
  id: string
  prompt: string
  status: EditTaskStatus
  createdAt: string
  resultAssetId?: string
}

export interface SlideRecord {
  id: string
  deckId: string
  pageNumber: number
  currentAssetId: string
  title?: string
  versions: SlideVersionRecord[]
  editTasks?: EditTaskRecord[]
}

export interface ThumbnailRecord {
  id: string
  blob: Blob
  width: number
  height: number
}
