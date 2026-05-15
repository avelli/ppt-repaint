import { create } from 'zustand'
import { generateId } from '../utils/id'

export type EditMode = 'whole-page' | 'mask'
export type EditTaskStatus = 'done' | 'generating' | 'error'

export interface EditTask {
  id: string
  prompt: string
  thumbnailUrl?: string
  status: EditTaskStatus
  createdAt: string
}

interface EditorState {
  currentSlideId: string | null
  editMode: EditMode
  instruction: string
  editHistory: Record<string, EditTask[]>
}

interface EditorActions {
  setCurrentSlideId: (id: string | null) => void
  setEditMode: (mode: EditMode) => void
  setInstruction: (instruction: string) => void
  clearInstruction: () => void
  addEditTask: (slideId: string, task: { prompt: string; status: EditTaskStatus; thumbnailUrl?: string }) => void
  updateEditTaskStatus: (slideId: string, taskId: string, status: EditTaskStatus) => void
  getSlideEditHistory: (slideId: string) => EditTask[]
  resetEditor: () => void
}

type EditorStore = EditorState & EditorActions

const initialState: EditorState = {
  currentSlideId: null,
  editMode: 'whole-page',
  instruction: '',
  editHistory: {},
}

export const useEditorStore = create<EditorStore>()((set, get) => ({
  ...initialState,

  setCurrentSlideId(id: string | null) {
    set({ currentSlideId: id })
  },

  setEditMode(mode: EditMode) {
    set({ editMode: mode })
  },

  setInstruction(instruction: string) {
    set({ instruction })
  },

  clearInstruction() {
    set({ instruction: '' })
  },

  addEditTask(slideId: string, task: { prompt: string; status: EditTaskStatus; thumbnailUrl?: string }) {
    const newTask: EditTask = {
      id: generateId(),
      prompt: task.prompt,
      thumbnailUrl: task.thumbnailUrl,
      status: task.status,
      createdAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    set((state) => ({
      editHistory: {
        ...state.editHistory,
        [slideId]: [newTask, ...(state.editHistory[slideId] ?? [])],
      },
    }))
  },

  updateEditTaskStatus(slideId: string, taskId: string, status: EditTaskStatus) {
    set((state) => {
      const tasks = state.editHistory[slideId]
      if (!tasks) return state
      return {
        editHistory: {
          ...state.editHistory,
          [slideId]: tasks.map((t) => t.id === taskId ? { ...t, status } : t),
        },
      }
    })
  },

  getSlideEditHistory(slideId: string) {
    return get().editHistory[slideId] ?? []
  },

  resetEditor() {
    set(initialState)
  },
}))
