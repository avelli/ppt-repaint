export interface EditRequest {
  slideId: string
  mode: string
  instruction: string
  stylePreset?: string
  constraints?: string[]
}

export interface EditResult {
  versionId: string
  imageUrl: string
}
