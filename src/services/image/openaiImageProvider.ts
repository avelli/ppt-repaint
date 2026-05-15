import type {
  ImageProvider,
  ImageEditOptions,
  ImageResult,
  ImageProviderConfig,
} from './imageProvider.types'

const DEFAULT_SIZE = '1920x1080'
const DEFAULT_QUALITY = 'auto'
const DEFAULT_OUTPUT_FORMAT = 'png'
const DEFAULT_MODERATION = 'auto'

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

function buildUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${base}/${path}`
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: { message?: string } }
    return body?.error?.message ?? `API 请求失败 (${response.status})`
  } catch {
    return `API 请求失败 (${response.status})`
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export class OpenAIImageProvider implements ImageProvider {
  name = 'openai'
  private config: ImageProviderConfig

  constructor(config: ImageProviderConfig) {
    this.config = config
  }

  async editImage(image: Blob, prompt: string, options?: ImageEditOptions): Promise<ImageResult> {
    const apiMode = this.config.apiMode ?? 'images'

    if (apiMode === 'responses') {
      return this.editViaResponsesApi(image, prompt, options)
    }
    return this.editViaImagesApi(image, prompt, options)
  }

  private async editViaImagesApi(image: Blob, prompt: string, options?: ImageEditOptions): Promise<ImageResult> {
    const size = options?.size ?? DEFAULT_SIZE
    const quality = options?.quality ?? DEFAULT_QUALITY
    const outputFormat = options?.outputFormat ?? DEFAULT_OUTPUT_FORMAT
    const moderation = options?.moderation ?? DEFAULT_MODERATION
    const mimeType = MIME_MAP[outputFormat] ?? 'image/png'

    const formData = new FormData()
    formData.append('model', this.config.model)
    formData.append('prompt', prompt)
    formData.append('size', size)
    formData.append('quality', quality)
    formData.append('output_format', outputFormat)
    formData.append('moderation', moderation)
    formData.append('response_format', 'b64_json')

    const ext = image.type.split('/')[1] || 'png'
    formData.append('image[]', image, `input.${ext}`)

    if (options?.mask) {
      formData.append('mask', options.mask, 'mask.png')
    }

    const { signal: fetchSignal, cleanup } = this.createSignal(options?.signal)

    try {
      const response = await fetch(
        buildUrl(this.config.baseUrl, 'images/edits'),
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.config.apiKey}` },
          body: formData,
          signal: fetchSignal,
        },
      )

      if (!response.ok) {
        const message = await extractErrorMessage(response)
        throw new Error(message)
      }

      const payload = await response.json() as {
        data: Array<{ b64_json?: string; revised_prompt?: string }>
      }

      if (!payload.data?.length || !payload.data[0].b64_json) {
        throw new Error('API 未返回图片数据')
      }

      const item = payload.data[0]
      const blob = base64ToBlob(item.b64_json!, mimeType)

      return { blob, mimeType, revisedPrompt: item.revised_prompt }
    } finally {
      cleanup()
    }
  }

  private async editViaResponsesApi(image: Blob, prompt: string, options?: ImageEditOptions): Promise<ImageResult> {
    const size = options?.size ?? DEFAULT_SIZE
    const quality = options?.quality ?? DEFAULT_QUALITY
    const outputFormat = options?.outputFormat ?? DEFAULT_OUTPUT_FORMAT
    const mimeType = MIME_MAP[outputFormat] ?? 'image/png'

    const imageDataUrl = await blobToDataUrl(image)

    const tool: Record<string, unknown> = {
      type: 'image_generation',
      action: 'edit',
      size,
      quality,
      output_format: outputFormat,
    }

    if (options?.mask) {
      const maskDataUrl = await blobToDataUrl(options.mask)
      tool.input_image_mask = { image_url: maskDataUrl }
    }

    const body = {
      model: this.config.model,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: imageDataUrl },
          ],
        },
      ],
      tools: [tool],
      tool_choice: 'required',
    }

    const { signal: fetchSignal, cleanup } = this.createSignal(options?.signal)

    try {
      const response = await fetch(
        buildUrl(this.config.baseUrl, 'responses'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: fetchSignal,
        },
      )

      if (!response.ok) {
        const message = await extractErrorMessage(response)
        throw new Error(message)
      }

      const payload = await response.json() as {
        output?: Array<{ type?: string; result?: string; revised_prompt?: string }>
      }

      const imageOutput = payload.output?.find((item) => item.type === 'image_generation_call')
      if (!imageOutput?.result) {
        throw new Error('API 未返回图片数据')
      }

      const base64 = imageOutput.result.replace(/^data:[^;]+;base64,/, '')
      const blob = base64ToBlob(base64, mimeType)

      return { blob, mimeType, revisedPrompt: imageOutput.revised_prompt }
    } finally {
      cleanup()
    }
  }

  private createSignal(externalSignal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController()
    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      this.config.timeout * 1000,
    )

    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timeoutId)
        throw new DOMException('Aborted', 'AbortError')
      }
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    return {
      signal: controller.signal,
      cleanup: () => clearTimeout(timeoutId),
    }
  }
}
