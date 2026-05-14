export interface ImageProvider {
  name: string
  generateImage(prompt: string, options?: ImageGenerateOptions): Promise<ImageResult>
  editImage(image: Blob, prompt: string, options?: ImageEditOptions): Promise<ImageResult>
}

export interface ImageGenerateOptions {
  size?: string
  quality?: string
  style?: string
}

export interface ImageEditOptions {
  mask?: Blob
  size?: string
}

export interface ImageResult {
  url?: string
  base64?: string
}
