import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenAIImageProvider } from '../openaiImageProvider'
import type { ImageProviderConfig } from '../imageProvider.types'

function createConfig(overrides?: Partial<ImageProviderConfig>): ImageProviderConfig {
  return {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-image-1',
    timeout: 60,
    ...overrides,
  }
}

function createPngBlob(): Blob {
  return new Blob([new Uint8Array(8)], { type: 'image/png' })
}

function createMaskBlob(): Blob {
  return new Blob([new Uint8Array(8)], { type: 'image/png' })
}

function createBase64Response(): object {
  const fakeBase64 = btoa('fake-image-data')
  return {
    data: [{ b64_json: fakeBase64, revised_prompt: '改进后的提示词' }],
  }
}

describe('OpenAIImageProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('name 属性为 openai', () => {
    const provider = new OpenAIImageProvider(createConfig())
    expect(provider.name).toBe('openai')
  })

  describe('editImage', () => {
    it('发送正确的 FormData 到 images/edits 端点', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createBase64Response()),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      await provider.editImage(image, '让背景变成蓝色')

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, options] = fetchMock.mock.calls[0]
      expect(url).toBe('https://api.openai.com/v1/images/edits')
      expect(options.method).toBe('POST')
      expect(options.headers.Authorization).toBe('Bearer test-api-key')

      const body = options.body as FormData
      expect(body.get('model')).toBe('gpt-image-1')
      expect(body.get('prompt')).toBe('让背景变成蓝色')
      expect(body.get('size')).toBe('1536x1024')
    })

    it('包含 mask 参数时附加遮罩文件', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createBase64Response()),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()
      const mask = createMaskBlob()

      await provider.editImage(image, '修改选中区域', { mask })

      const body = fetchMock.mock.calls[0][1].body as FormData
      expect(body.get('mask')).toBeInstanceOf(Blob)
    })

    it('自定义 size 参数', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createBase64Response()),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      await provider.editImage(image, '测试', { size: '1024x1024' })

      const body = fetchMock.mock.calls[0][1].body as FormData
      expect(body.get('size')).toBe('1024x1024')
    })

    it('自定义 quality 参数', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createBase64Response()),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      await provider.editImage(image, '测试', { quality: 'high' })

      const body = fetchMock.mock.calls[0][1].body as FormData
      expect(body.get('quality')).toBe('high')
    })

    it('返回 Blob 结果和 revisedPrompt', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createBase64Response()),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      const result = await provider.editImage(image, '测试')

      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.mimeType).toBe('image/png')
      expect(result.revisedPrompt).toBe('改进后的提示词')
    })

    it('支持 webp 输出格式', async () => {
      const fakeBase64 = btoa('fake-webp-data')
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: fakeBase64 }] }),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      const result = await provider.editImage(image, '测试', { outputFormat: 'webp' })

      const body = fetchMock.mock.calls[0][1].body as FormData
      expect(body.get('output_format')).toBe('webp')
      expect(result.mimeType).toBe('image/webp')
    })

    it('自定义 baseUrl 正确拼接路径', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createBase64Response()),
      })

      const provider = new OpenAIImageProvider(
        createConfig({ baseUrl: 'https://my-proxy.com/api/v1' }),
      )
      const image = createPngBlob()

      await provider.editImage(image, '测试')

      const url = fetchMock.mock.calls[0][0]
      expect(url).toBe('https://my-proxy.com/api/v1/images/edits')
    })

    it('baseUrl 末尾有斜杠时不重复', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createBase64Response()),
      })

      const provider = new OpenAIImageProvider(
        createConfig({ baseUrl: 'https://my-proxy.com/v1/' }),
      )
      const image = createPngBlob()

      await provider.editImage(image, '测试')

      const url = fetchMock.mock.calls[0][0]
      expect(url).toBe('https://my-proxy.com/v1/images/edits')
    })

    it('API 返回非 200 时抛出错误', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      await expect(provider.editImage(image, '测试'))
        .rejects.toThrow('Invalid API key')
    })

    it('API 返回 429 时抛出包含状态码的错误', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      await expect(provider.editImage(image, '测试'))
        .rejects.toThrow('Rate limit exceeded')
    })

    it('API 返回空数据时抛出错误', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      await expect(provider.editImage(image, '测试'))
        .rejects.toThrow()
    })

    it('支持 AbortSignal 取消请求', async () => {
      fetchMock.mockImplementation(
        (_url: string, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }),
      )

      const provider = new OpenAIImageProvider(createConfig({ timeout: 30 }))
      const image = createPngBlob()
      const controller = new AbortController()

      const promise = provider.editImage(image, '测试', { signal: controller.signal })
      controller.abort()

      await expect(promise).rejects.toThrow()
    })

    it('超时后自动取消请求', async () => {
      vi.useFakeTimers()

      fetchMock.mockImplementation(
        (_url: string, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }),
      )

      const provider = new OpenAIImageProvider(createConfig({ timeout: 1 }))
      const image = createPngBlob()

      const promise = provider.editImage(image, '测试')
      vi.advanceTimersByTime(1500)

      await expect(promise).rejects.toThrow()
      vi.useRealTimers()
    })

    it('image[] 字段名用于上传图片', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createBase64Response()),
      })

      const provider = new OpenAIImageProvider(createConfig())
      const image = createPngBlob()

      await provider.editImage(image, '测试')

      const body = fetchMock.mock.calls[0][1].body as FormData
      expect(body.has('image[]')).toBe(true)
    })
  })
})
