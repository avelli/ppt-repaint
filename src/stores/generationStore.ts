import { create } from 'zustand'

export interface GenerationState {
  isGenerating: boolean
  progress: string
  error: string | null
  abortController: AbortController | null
}

interface GenerationActions {
  startGeneration: () => AbortController
  setProgress: (progress: string) => void
  setError: (error: string | null) => void
  finishGeneration: () => void
  abortGeneration: () => void
}

type GenerationStore = GenerationState & GenerationActions

export const useGenerationStore = create<GenerationStore>()((set, get) => ({
  isGenerating: false,
  progress: '',
  error: null,
  abortController: null,

  startGeneration: () => {
    const existing = get().abortController
    if (existing) existing.abort()

    const controller = new AbortController()
    set({
      isGenerating: true,
      progress: '准备中...',
      error: null,
      abortController: controller,
    })
    return controller
  },

  setProgress: (progress) => set({ progress }),

  setError: (error) => set({ error, isGenerating: false, abortController: null }),

  finishGeneration: () => set({
    isGenerating: false,
    progress: '',
    abortController: null,
  }),

  abortGeneration: () => {
    const controller = get().abortController
    if (controller) controller.abort()
    set({
      isGenerating: false,
      progress: '',
      error: null,
      abortController: null,
    })
  },
}))
