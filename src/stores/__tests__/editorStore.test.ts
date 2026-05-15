import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../editorStore'

function resetStore() {
  useEditorStore.setState(useEditorStore.getInitialState())
}

describe('editorStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('currentSlideId', () => {
    it('初始值为 null', () => {
      expect(useEditorStore.getState().currentSlideId).toBeNull()
    })

    it('setCurrentSlideId 设置当前 slide', () => {
      useEditorStore.getState().setCurrentSlideId('slide-1')
      expect(useEditorStore.getState().currentSlideId).toBe('slide-1')
    })

    it('setCurrentSlideId(null) 清除选中', () => {
      useEditorStore.getState().setCurrentSlideId('slide-1')
      useEditorStore.getState().setCurrentSlideId(null)
      expect(useEditorStore.getState().currentSlideId).toBeNull()
    })
  })

  describe('editMode', () => {
    it('初始值为 whole-page', () => {
      expect(useEditorStore.getState().editMode).toBe('whole-page')
    })

    it('setEditMode 切换编辑模式', () => {
      useEditorStore.getState().setEditMode('mask')
      expect(useEditorStore.getState().editMode).toBe('mask')
    })
  })

  describe('instruction', () => {
    it('初始值为空字符串', () => {
      expect(useEditorStore.getState().instruction).toBe('')
    })

    it('setInstruction 设置编辑指令', () => {
      useEditorStore.getState().setInstruction('让背景更简洁')
      expect(useEditorStore.getState().instruction).toBe('让背景更简洁')
    })

    it('clearInstruction 清空指令', () => {
      useEditorStore.getState().setInstruction('test')
      useEditorStore.getState().clearInstruction()
      expect(useEditorStore.getState().instruction).toBe('')
    })
  })

  describe('editHistory', () => {
    it('初始为空对象', () => {
      expect(useEditorStore.getState().editHistory).toEqual({})
    })

    it('addEditTask 添加编辑任务到指定 slide', () => {
      useEditorStore.getState().addEditTask('slide-1', {
        prompt: '美化标题',
        status: 'done',
      })
      const history = useEditorStore.getState().editHistory['slide-1']
      expect(history).toHaveLength(1)
      expect(history[0].prompt).toBe('美化标题')
      expect(history[0].status).toBe('done')
      expect(history[0].id).toBeDefined()
      expect(history[0].createdAt).toBeDefined()
    })

    it('addEditTask 新任务插入到列表头部', () => {
      useEditorStore.getState().addEditTask('slide-1', {
        prompt: '第一个',
        status: 'done',
      })
      useEditorStore.getState().addEditTask('slide-1', {
        prompt: '第二个',
        status: 'done',
      })
      const history = useEditorStore.getState().editHistory['slide-1']
      expect(history).toHaveLength(2)
      expect(history[0].prompt).toBe('第二个')
      expect(history[1].prompt).toBe('第一个')
    })

    it('addEditTask 不同 slide 的历史互不影响', () => {
      useEditorStore.getState().addEditTask('slide-1', {
        prompt: 'task-a',
        status: 'done',
      })
      useEditorStore.getState().addEditTask('slide-2', {
        prompt: 'task-b',
        status: 'done',
      })
      expect(useEditorStore.getState().editHistory['slide-1']).toHaveLength(1)
      expect(useEditorStore.getState().editHistory['slide-2']).toHaveLength(1)
    })

    it('updateEditTaskStatus 更新任务状态', () => {
      useEditorStore.getState().addEditTask('slide-1', {
        prompt: '生成中',
        status: 'generating',
      })
      const taskId = useEditorStore.getState().editHistory['slide-1'][0].id
      useEditorStore.getState().updateEditTaskStatus('slide-1', taskId, 'done')
      expect(useEditorStore.getState().editHistory['slide-1'][0].status).toBe('done')
    })

    it('updateEditTaskStatus 对不存在的 task 无副作用', () => {
      useEditorStore.getState().addEditTask('slide-1', {
        prompt: 'test',
        status: 'done',
      })
      useEditorStore.getState().updateEditTaskStatus('slide-1', 'nonexistent', 'error')
      expect(useEditorStore.getState().editHistory['slide-1'][0].status).toBe('done')
    })

    it('getSlideEditHistory 返回指定 slide 的历史', () => {
      useEditorStore.getState().addEditTask('slide-1', {
        prompt: 'test',
        status: 'done',
      })
      const history = useEditorStore.getState().getSlideEditHistory('slide-1')
      expect(history).toHaveLength(1)
    })

    it('getSlideEditHistory 对无历史的 slide 返回空数组', () => {
      const history = useEditorStore.getState().getSlideEditHistory('nonexistent')
      expect(history).toEqual([])
    })
  })

  describe('reset', () => {
    it('resetEditor 重置所有编辑器状态', () => {
      useEditorStore.getState().setCurrentSlideId('slide-1')
      useEditorStore.getState().setEditMode('mask')
      useEditorStore.getState().setInstruction('test')
      useEditorStore.getState().addEditTask('slide-1', { prompt: 'x', status: 'done' })

      useEditorStore.getState().resetEditor()

      const state = useEditorStore.getState()
      expect(state.currentSlideId).toBeNull()
      expect(state.editMode).toBe('whole-page')
      expect(state.instruction).toBe('')
      expect(state.editHistory).toEqual({})
    })
  })
})
