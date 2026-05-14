import { create } from 'zustand'

interface EditorStore {}

export const useEditorStore = create<EditorStore>()(() => ({}))
