import { useState } from 'react'
import type { EditTask } from '../../stores/editorStore'

export type { EditTask }

interface RightEditPanelProps {
  collapsed: boolean
  onToggleCollapse: () => void
  slideTitle: string
  tasks: EditTask[]
  onSubmit: (prompt: string) => void
  onOpenSettings: () => void
  isGenerating?: boolean
}

const HEADER_PX = 'px-3'
const HEADER_PY = 'py-3'

function PanelToggleButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border border-cream-400 bg-cream-50 flex items-center justify-center hover:bg-cream-200 transition-colors"
      aria-label={collapsed ? '展开编辑面板' : '收起编辑面板'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-700">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M15 3v18" />
      </svg>
    </button>
  )
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border border-cream-400 bg-cream-50 flex items-center justify-center hover:bg-cream-200 transition-colors"
      aria-label="API 设置"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-700">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  )
}

function TaskCardItem({ task }: { task: EditTask }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-cream-300 bg-white hover:shadow-sm transition-shadow">
      <div className="w-24 h-16 rounded-lg bg-cream-200 shrink-0 overflow-hidden flex items-center justify-center">
        {task.thumbnailUrl ? (
          <img src={task.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cream-400">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <p className="text-sm text-warm-800 font-medium line-clamp-2">{task.prompt}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-warm-700/50">{task.createdAt}</span>
          {task.status === 'generating' && (
            <span className="text-xs text-sage-600 font-medium">生成中...</span>
          )}
          {task.status === 'error' && (
            <span className="text-xs text-red-500 font-medium">失败</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function RightEditPanel({ collapsed, onToggleCollapse, slideTitle, tasks, onSubmit, onOpenSettings, isGenerating }: RightEditPanelProps) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isGenerating) return
    onSubmit(trimmed)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (collapsed) {
    return (
      <div className={`flex flex-col items-center h-full ${HEADER_PX} ${HEADER_PY} gap-2`}>
        <PanelToggleButton collapsed onClick={onToggleCollapse} />
        <SettingsButton onClick={onOpenSettings} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className={`flex items-center justify-between ${HEADER_PX} ${HEADER_PY} shrink-0 border-b border-cream-300/60`}>
        <span className="text-sm text-warm-700 font-medium truncate mr-2">{slideTitle}</span>
        <div className="flex items-center gap-1.5">
          <SettingsButton onClick={onOpenSettings} />
          <PanelToggleButton collapsed={false} onClick={onToggleCollapse} />
        </div>
      </header>

      {/* Task Card List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCardItem key={task.id} task={task} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-cream-500 text-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <p>输入指令开始编辑</p>
          </div>
        )}
      </div>

      {/* Bottom Input Bar */}
      <div className="shrink-0 border-t border-cream-300/60 px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想要的修改效果..."
            disabled={isGenerating}
            className="flex-1 min-h-[40px] max-h-[120px] rounded-xl border border-cream-400 bg-white px-4 py-2.5 text-sm text-warm-900 placeholder:text-cream-500 resize-none focus:outline-none focus:border-sage-400 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isGenerating}
            className="w-10 h-10 rounded-xl bg-sage-500 flex items-center justify-center hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isGenerating ? (
              <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin text-white">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
