export type ApiMode = 'images' | 'responses'

export interface ImageProvider {
  name: string
  editImage(image: Blob, prompt: string, options?: ImageEditOptions): Promise<ImageResult>
}

export interface ImageEditOptions {
  mask?: Blob
  size?: string
  quality?: string
  outputFormat?: 'png' | 'jpeg' | 'webp'
  moderation?: 'auto' | 'low'
  signal?: AbortSignal
}

export interface ImageResult {
  blob: Blob
  mimeType: string
  revisedPrompt?: string
}

export interface ImageProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
  timeout: number
  apiMode?: ApiMode
}
