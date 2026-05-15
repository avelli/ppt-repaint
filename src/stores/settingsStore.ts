import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ApiMode = 'images' | 'responses'

export interface SettingsState {
  apiKey: string
  baseUrl: string
  model: string
  apiMode: ApiMode
  quality: 'auto' | 'high' | 'medium' | 'low'
  size: string
  outputFormat: 'png' | 'jpeg' | 'webp'
  moderation: 'auto' | 'low'
  timeout: number
}

interface SettingsActions {
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setModel: (model: string) => void
  setApiMode: (mode: ApiMode) => void
  setQuality: (quality: SettingsState['quality']) => void
  setSize: (size: string) => void
  setOutputFormat: (format: SettingsState['outputFormat']) => void
  setModeration: (moderation: SettingsState['moderation']) => void
  setTimeout: (timeout: number) => void
  resetToDefaults: () => void
}

type SettingsStore = SettingsState & SettingsActions

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-image-1'
const DEFAULT_TIMEOUT = 600
const DEFAULT_SIZE = '1536x1024'

const defaultState: SettingsState = {
  apiKey: '',
  baseUrl: DEFAULT_BASE_URL,
  model: DEFAULT_MODEL,
  apiMode: 'images',
  quality: 'auto',
  size: DEFAULT_SIZE,
  outputFormat: 'png',
  moderation: 'auto',
  timeout: DEFAULT_TIMEOUT,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setModel: (model) => set({ model }),
      setApiMode: (apiMode) => set({ apiMode }),
      setQuality: (quality) => set({ quality }),
      setSize: (size) => set({ size }),
      setOutputFormat: (outputFormat) => set({ outputFormat }),
      setModeration: (moderation) => set({ moderation }),
      setTimeout: (timeout) => set({ timeout }),
      resetToDefaults: () => set(defaultState),
    }),
    { name: 'oh-my-ppt-settings' },
  ),
)
