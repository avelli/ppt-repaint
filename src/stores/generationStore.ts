import { create } from 'zustand'

interface GenerationStore {}

export const useGenerationStore = create<GenerationStore>()(() => ({}))
