import { useState, useRef, useEffect } from 'react'

interface SlideItem {
  id: string
  pageNumber: number
  title: string
  thumbnailUrl?: string
  isCurrent: boolean
  generationCount: number
}

interface SlideSidebarProps {
  slides: SlideItem[]
  totalPages: number
  collapsed: boolean
  onSlideSelect: (id: string) => void
  onSlideRename: (id: string, newTitle: string) => void
  onToggleCollapse: () => void
  onImport?: () => void
  onNewProject?: () => void
  isLoading?: boolean
}

const HEADER_PX = 'px-3'
const HEADER_PY = 'py-3'

function SidebarToggleButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border border-cream-400 bg-cream-50 flex items-center justify-center hover:bg-cream-200 transition-colors"
      aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-700">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
      </svg>
    </button>
  )
}

function ImportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border border-sage-400 bg-sage-50 flex items-center justify-center hover:bg-sage-100 transition-colors"
      aria-label="导入图片"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-600">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  )
}

function NewProjectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border border-cream-400 bg-cream-50 flex items-center justify-center hover:bg-cream-200 transition-colors"
      aria-label="新增项目"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-700">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    </button>
  )
}

function EditableTitle({ slideId, title, onRename }: { slideId: string; title: string; onRename: (id: string, newTitle: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== title) {
      onRename(slideId, trimmed)
    } else {
      setValue(title)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setValue(title); setEditing(false) }
        }}
        className="text-sm text-warm-800 font-medium mt-1.5 px-1 w-full bg-white border border-sage-400 rounded outline-none"
      />
    )
  }

  return (
    <div className="flex items-center gap-1 mt-1.5 px-1">
      <p className="text-sm text-warm-800 font-medium truncate flex-1">
        {title}
      </p>
      <button
        onClick={() => { setEditing(true); setValue(title) }}
        className="w-5 h-5 shrink-0 rounded flex items-center justify-center text-warm-700/40 hover:text-sage-600 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="重命名"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>
    </div>
  )
}

export function SlideSidebar({ slides, totalPages, collapsed, onSlideSelect, onSlideRename, onToggleCollapse, onImport, onNewProject, isLoading }: SlideSidebarProps) {
  if (collapsed) {
    return (
      <div className={`flex flex-col items-center h-full ${HEADER_PX} ${HEADER_PY} gap-2`}>
        <SidebarToggleButton collapsed onClick={onToggleCollapse} />
        {onNewProject && <NewProjectButton onClick={onNewProject} />}
        {onImport && <ImportButton onClick={onImport} />}
        <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => onSlideSelect(slide.id)}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-medium transition-colors ${
                slide.isCurrent
                  ? 'border-sage-400 bg-sage-400 text-white'
                  : 'border-cream-400 bg-cream-50 text-warm-700 hover:bg-cream-200'
              }`}
            >
              {slide.pageNumber}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className={`flex items-center justify-between ${HEADER_PX} ${HEADER_PY} shrink-0`}>
        <div className="flex items-center gap-2">
          <SidebarToggleButton collapsed={false} onClick={onToggleCollapse} />
          {onNewProject && <NewProjectButton onClick={onNewProject} />}
          {onImport && <ImportButton onClick={onImport} />}
        </div>
        <span className="text-sm text-warm-700/60 font-medium">
          {isLoading ? '加载中...' : `共 ${totalPages} 页`}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {slides.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-cream-500">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm mb-2">暂无幻灯片</p>
            {onImport && (
              <button
                onClick={onImport}
                className="text-sm text-sage-600 hover:text-sage-700 font-medium"
              >
                点击导入图片
              </button>
            )}
          </div>
        )}
        {slides.map((slide) => (
          <div key={slide.id} className="group">
            <button
              onClick={() => onSlideSelect(slide.id)}
              className={`w-full rounded-2xl overflow-hidden border-2 transition-all ${
                slide.isCurrent
                  ? 'border-sage-400 shadow-md'
                  : 'border-transparent hover:border-cream-400 hover:shadow-sm'
              }`}
            >
              <div className="aspect-[16/9] bg-white rounded-xl m-1 overflow-hidden flex items-center justify-center relative">
                {slide.thumbnailUrl ? (
                  <img
                    src={slide.thumbnailUrl}
                    alt={`第 ${slide.pageNumber} 页`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-cream-500 text-sm">暂无预览</div>
                )}
                <span className="absolute top-1 left-1.5 text-xs text-warm-700/50 font-medium">
                  {slide.pageNumber}
                </span>
                {slide.generationCount > 0 && (
                  <div className="absolute top-1 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-warm-900/70 text-white text-[10px] font-medium backdrop-blur-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="15" height="15" rx="2" />
                      <rect x="7" y="7" width="15" height="15" rx="2" />
                    </svg>
                    <span>{slide.generationCount}</span>
                  </div>
                )}
              </div>
            </button>
            {slide.title && (
              <EditableTitle slideId={slide.id} title={slide.title} onRename={onSlideRename} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
