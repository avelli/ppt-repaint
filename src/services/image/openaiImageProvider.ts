import type { ImageProvider, ImageGenerateOptions, ImageEditOptions, ImageResult } from './imageProvider.types'

export class OpenAIImageProvider implements ImageProvider {
  name = 'openai'

  async generateImage(_prompt: string, _options?: ImageGenerateOptions): Promise<ImageResult> {
    throw new Error('Not implemented')
  }

  async editImage(_image: Blob, _prompt: string, _options?: ImageEditOptions): Promise<ImageResult> {
    throw new Error('Not implemented')
  }
}
