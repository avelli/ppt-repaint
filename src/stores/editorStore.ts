import { create } from 'zustand'
import { generateId } from '../utils/id'
import { slideRepository } from '../services/storage/slideRepository'
import { assetRepository } from '../services/storage/assetRepository'
import type { EditTaskRecord } from '../types/storage'

export type EditMode = 'whole-page' | 'mask'
export type EditTaskStatus = 'done' | 'generating' | 'error'

export interface EditTask {
  id: string
  prompt: string
  thumbnailUrl?: string
  resultAssetId?: string
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
  addEditTask: (slideId: string, task: { prompt: string; status: EditTaskStatus; thumbnailUrl?: string }) => string
  updateEditTaskStatus: (slideId: string, taskId: string, status: EditTaskStatus) => void
  updateEditTaskThumbnail: (slideId: string, taskId: string, thumbnailUrl: string) => void
  completeEditTask: (slideId: string, taskId: string, resultAssetId: string, thumbnailUrl: string) => void
  getSlideEditHistory: (slideId: string) => EditTask[]
  loadEditHistory: (slideId: string) => Promise<void>
  resetEditor: () => void
}

type EditorStore = EditorState & EditorActions

const initialState: EditorState = {
  currentSlideId: null,
  editMode: 'whole-page',
  instruction: '',
  editHistory: {},
}

function toEditTaskRecord(task: EditTask): EditTaskRecord {
  return {
    id: task.id,
    prompt: task.prompt,
    status: task.status,
    createdAt: task.createdAt,
    resultAssetId: task.resultAssetId,
  }
}

function persistEditTasks(slideId: string, tasks: EditTask[]) {
  const records = tasks.map(toEditTaskRecord)
  slideRepository.getById(slideId).then((record) => {
    if (record) {
      slideRepository.update({ ...record, editTasks: records })
    }
  })
}

export const useEditorStore = create<EditorStore>()((set, get) => ({
  ...initialState,

  setCurrentSlideId(id: string | null) {
    set({ currentSlideId: id })
    if (id) {
      get().loadEditHistory(id)
    }
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
    set((state) => {
      const updated = [newTask, ...(state.editHistory[slideId] ?? [])]
      persistEditTasks(slideId, updated)
      return {
        editHistory: {
          ...state.editHistory,
          [slideId]: updated,
        },
      }
    })
    return newTask.id
  },

  updateEditTaskStatus(slideId: string, taskId: string, status: EditTaskStatus) {
    set((state) => {
      const tasks = state.editHistory[slideId]
      if (!tasks) return state
      const updated = tasks.map((t) => t.id === taskId ? { ...t, status } : t)
      persistEditTasks(slideId, updated)
      return {
        editHistory: {
          ...state.editHistory,
          [slideId]: updated,
        },
      }
    })
  },

  updateEditTaskThumbnail(slideId: string, taskId: string, thumbnailUrl: string) {
    set((state) => {
      const tasks = state.editHistory[slideId]
      if (!tasks) return state
      const updated = tasks.map((t) => t.id === taskId ? { ...t, thumbnailUrl } : t)
      return {
        editHistory: {
          ...state.editHistory,
          [slideId]: updated,
        },
      }
    })
  },

  completeEditTask(slideId: string, taskId: string, resultAssetId: string, thumbnailUrl: string) {
    set((state) => {
      const tasks = state.editHistory[slideId]
      if (!tasks) return state
      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'done' as EditTaskStatus, resultAssetId, thumbnailUrl } : t,
      )
      persistEditTasks(slideId, updated)
      return {
        editHistory: {
          ...state.editHistory,
          [slideId]: updated,
        },
      }
    })
  },

  getSlideEditHistory(slideId: string) {
    return get().editHistory[slideId] ?? []
  },

  async loadEditHistory(slideId: string) {
    if (get().editHistory[slideId]) return
    const record = await slideRepository.getById(slideId)
    if (!record?.editTasks?.length) return
    const tasks: EditTask[] = await Promise.all(
      record.editTasks.map(async (r) => {
        let thumbnailUrl: string | undefined
        if (r.resultAssetId) {
          const thumb = await assetRepository.getThumbnail(r.resultAssetId)
          if (thumb) {
            thumbnailUrl = URL.createObjectURL(thumb.blob)
          }
        }
        return {
          id: r.id,
          prompt: r.prompt,
          status: r.status,
          createdAt: r.createdAt,
          resultAssetId: r.resultAssetId,
          thumbnailUrl,
        }
      }),
    )
    set((state) => ({
      editHistory: {
        ...state.editHistory,
        [slideId]: tasks,
      },
    }))
  },

  resetEditor() {
    set(initialState)
  },
}))
