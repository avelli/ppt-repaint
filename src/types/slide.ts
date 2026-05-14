export interface Slide {
  id: string
  deckId: string
  pageNumber: number
  imageUrl: string
  versions: SlideVersion[]
}

export interface SlideVersion {
  id: string
  imageUrl: string
  prompt: string
  createdAt: number
}
