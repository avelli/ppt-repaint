import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import type { SettingsState } from '../../stores/settingsStore'

interface ApiSettingsModalProps {
  open: boolean
  onClose: () => void
}

const SIZE_OPTIONS = [
  { value: '1920x1080', label: '1920×1080 (Full HD)' },
  { value: '2560x1440', label: '2560×1440 (2K)' },
  { value: '3840x2160', label: '3840×2160 (4K)' },
]

export function ApiSettingsModal({ open, onClose }: ApiSettingsModalProps) {
  const settings = useSettingsStore()

  const [local, setLocal] = useState<SettingsState>({
    apiKey: settings.apiKey,
    baseUrl: settings.baseUrl,
    model: settings.model,
    apiMode: settings.apiMode,
    quality: settings.quality,
    size: settings.size,
    outputFormat: settings.outputFormat,
    moderation: settings.moderation,
    timeout: settings.timeout,
  })
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  useEffect(() => {
    if (open) {
      setLocal({
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        apiMode: settings.apiMode,
        quality: settings.quality,
        size: settings.size,
        outputFormat: settings.outputFormat,
        moderation: settings.moderation,
        timeout: settings.timeout,
      })
      setTestStatus('idle')
      setTestError('')
    }
  }, [open, settings.apiKey, settings.baseUrl, settings.model, settings.apiMode, settings.quality, settings.size, settings.outputFormat, settings.moderation, settings.timeout])

  if (!open) return null

  const update = (patch: Partial<SettingsState>) => setLocal((prev) => ({ ...prev, ...patch }))

  const handleSave = () => {
    settings.setApiKey(local.apiKey.trim())
    settings.setBaseUrl(local.baseUrl.trim() || 'https://api.openai.com/v1')
    settings.setModel(local.model.trim() || 'gpt-image-1')
    settings.setApiMode(local.apiMode)
    settings.setQuality(local.quality)
    settings.setSize(local.size)
    settings.setOutputFormat(local.outputFormat)
    settings.setModeration(local.moderation)
    const t = typeof local.timeout === 'number' ? local.timeout : parseInt(String(local.timeout), 10)
    settings.setTimeout(isNaN(t) || t < 10 ? 600 : Math.min(t, 1200))
    onClose()
  }

  const handleTest = async () => {
    if (!local.apiKey.trim() || !local.baseUrl.trim()) {
      setTestStatus('error')
      setTestError('请先填写 API Key 和 Base URL')
      return
    }

    setTestStatus('testing')
    setTestError('')

    try {
      const base = local.baseUrl.trim().replace(/\/+$/, '')
      const response = await fetch(`${base}/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${local.apiKey.trim()}` },
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        setTestStatus('success')
      } else {
        const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
        setTestStatus('error')
        setTestError(body?.error?.message ?? `HTTP ${response.status}`)
      }
    } catch (err) {
      setTestStatus('error')
      setTestError(err instanceof Error ? err.message : '连接失败')
    }
  }

  const handleReset = () => {
    settings.resetToDefaults()
    setLocal({
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-image-1',
      apiMode: 'images',
      quality: 'auto',
      size: '1536x1024',
      outputFormat: 'png',
      moderation: 'auto',
      timeout: 600,
    })
  }

  const backdropMouseDownTarget = useRef<EventTarget | null>(null)

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    backdropMouseDownTarget.current = e.target
  }

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && backdropMouseDownTarget.current === e.currentTarget) {
      onClose()
    }
    backdropMouseDownTarget.current = null
  }

  const maskedKey = local.apiKey
    ? showKey
      ? local.apiKey
      : `${local.apiKey.slice(0, 7)}${'•'.repeat(Math.max(0, local.apiKey.length - 11))}${local.apiKey.slice(-4)}`
    : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div className="w-[480px] max-h-[85vh] bg-white rounded-2xl shadow-xl border border-cream-300 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-600">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <h2 className="text-base font-semibold text-warm-900">API 配置</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-cream-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-warm-600">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Content - placeholder for continuation */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Connection Section */}
          <Section title="连接">
            <FieldGroup label="API Key" hint="存储在浏览器本地，不会上传到任何服务器">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={showKey ? local.apiKey : maskedKey}
                  onChange={(e) => update({ apiKey: e.target.value })}
                  onFocus={() => setShowKey(true)}
                  placeholder="sk-..."
                  className="w-full h-10 rounded-lg border border-cream-400 bg-cream-50 px-3 pr-20 text-sm text-warm-900 placeholder:text-cream-500 focus:outline-none focus:border-sage-400 transition-colors font-mono"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-cream-200 transition-colors"
                    title={showKey ? '隐藏' : '显示'}
                  >
                    <EyeIcon open={showKey} />
                  </button>
                  {local.apiKey && (
                    <button
                      type="button"
                      onClick={() => update({ apiKey: '' })}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-cream-200 transition-colors"
                      title="清除"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-warm-400">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </FieldGroup>

            <FieldGroup label="Base URL">
              <input
                type="text"
                value={local.baseUrl}
                onChange={(e) => update({ baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full h-10 rounded-lg border border-cream-400 bg-cream-50 px-3 text-sm text-warm-900 placeholder:text-cream-500 focus:outline-none focus:border-sage-400 transition-colors font-mono"
              />
            </FieldGroup>

            <FieldGroup label="接口模式">
              <div className="flex gap-2">
                <ModeButton
                  active={local.apiMode === 'images'}
                  onClick={() => update({ apiMode: 'images' })}
                  label="Images API"
                  desc="images/edits"
                />
                <ModeButton
                  active={local.apiMode === 'responses'}
                  onClick={() => update({ apiMode: 'responses' })}
                  label="Responses API"
                  desc="responses"
                />
              </div>
            </FieldGroup>

            {/* Test Connection */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTest}
                disabled={testStatus === 'testing'}
                className="h-8 px-3 rounded-lg border border-cream-400 text-xs text-warm-700 hover:bg-cream-100 disabled:opacity-50 transition-colors"
              >
                {testStatus === 'testing' ? '测试中...' : '测试连接'}
              </button>
              {testStatus === 'success' && (
                <span className="text-xs text-green-600 font-medium">连接成功</span>
              )}
              {testStatus === 'error' && (
                <span className="text-xs text-red-500">{testError || '连接失败'}</span>
              )}
            </div>
          </Section>

          {/* Model Section */}
          <Section title="模型">
            <FieldGroup label="模型 ID">
              <input
                type="text"
                value={local.model}
                onChange={(e) => update({ model: e.target.value })}
                placeholder="gpt-image-1"
                className="w-full h-10 rounded-lg border border-cream-400 bg-cream-50 px-3 text-sm text-warm-900 placeholder:text-cream-500 focus:outline-none focus:border-sage-400 transition-colors font-mono"
              />
              <p className="mt-1 text-xs text-warm-500">支持 gpt-image-1 / gpt-image-2 等 OpenAI 图片模型</p>
            </FieldGroup>

            <FieldGroup label="超时时间">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={local.timeout}
                  onChange={(e) => update({ timeout: parseInt(e.target.value, 10) || 600 })}
                  min={10}
                  max={1200}
                  className="w-24 h-10 rounded-lg border border-cream-400 bg-cream-50 px-3 text-sm text-warm-900 focus:outline-none focus:border-sage-400 transition-colors"
                />
                <span className="text-sm text-warm-500">秒</span>
              </div>
            </FieldGroup>
          </Section>

          {/* Generation Params Section */}
          <Section title="生成参数">
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="输出尺寸">
                <select
                  value={local.size}
                  onChange={(e) => update({ size: e.target.value })}
                  className="w-full h-10 rounded-lg border border-cream-400 bg-cream-50 px-3 text-sm text-warm-900 focus:outline-none focus:border-sage-400 transition-colors"
                >
                  {SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="质量">
                <select
                  value={local.quality}
                  onChange={(e) => update({ quality: e.target.value as SettingsState['quality'] })}
                  className="w-full h-10 rounded-lg border border-cream-400 bg-cream-50 px-3 text-sm text-warm-900 focus:outline-none focus:border-sage-400 transition-colors"
                >
                  <option value="auto">auto</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
              </FieldGroup>

              <FieldGroup label="输出格式">
                <select
                  value={local.outputFormat}
                  onChange={(e) => update({ outputFormat: e.target.value as SettingsState['outputFormat'] })}
                  className="w-full h-10 rounded-lg border border-cream-400 bg-cream-50 px-3 text-sm text-warm-900 focus:outline-none focus:border-sage-400 transition-colors"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </FieldGroup>

              <FieldGroup label="内容审核">
                <select
                  value={local.moderation}
                  onChange={(e) => update({ moderation: e.target.value as SettingsState['moderation'] })}
                  className="w-full h-10 rounded-lg border border-cream-400 bg-cream-50 px-3 text-sm text-warm-900 focus:outline-none focus:border-sage-400 transition-colors"
                >
                  <option value="auto">auto（默认）</option>
                  <option value="low">low（宽松）</option>
                </select>
              </FieldGroup>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between px-5 py-4 border-t border-cream-200">
          <button
            onClick={handleReset}
            className="h-9 px-3 rounded-lg text-xs text-warm-500 hover:text-warm-700 hover:bg-cream-100 transition-colors"
          >
            恢复默认
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-cream-400 text-sm text-warm-700 hover:bg-cream-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="h-9 px-4 rounded-lg bg-sage-500 text-sm text-white font-medium hover:bg-sage-600 transition-colors"
            >
              保存
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-warm-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-warm-400">{hint}</p>}
    </div>
  )
}

function ModeButton({ active, onClick, label, desc }: { active: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${
        active
          ? 'border-sage-400 bg-sage-50 text-sage-700'
          : 'border-cream-400 bg-cream-50 text-warm-600 hover:bg-cream-100'
      }`}
    >
      <span className="block">{label}</span>
      <span className="block text-[10px] font-normal opacity-60">{desc}</span>
    </button>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-warm-500">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  )
}
