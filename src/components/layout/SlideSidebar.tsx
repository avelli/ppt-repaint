import { useState, useRef, useEffect } from 'react'

interface SlideItem {
  id: string
  pageNumber: number
  title: string
  thumbnailUrl?: string
  isCurrent: boolean
}

interface SlideSidebarProps {
  slides: SlideItem[]
  totalPages: number
  collapsed: boolean
  onSlideSelect: (id: string) => void
  onSlideRename: (id: string, newTitle: string) => void
  onToggleCollapse: () => void
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
    <p
      onClick={() => { setEditing(true); setValue(title) }}
      className="text-sm text-warm-800 font-medium mt-1.5 px-1 truncate cursor-pointer hover:text-sage-600 transition-colors"
      title="点击重命名"
    >
      {title}
    </p>
  )
}

export function SlideSidebar({ slides, totalPages, collapsed, onSlideSelect, onSlideRename, onToggleCollapse }: SlideSidebarProps) {
  if (collapsed) {
    return (
      <div className={`flex flex-col items-center h-full ${HEADER_PX} ${HEADER_PY} gap-2`}>
        <SidebarToggleButton collapsed onClick={onToggleCollapse} />
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
        <SidebarToggleButton collapsed={false} onClick={onToggleCollapse} />
        <span className="text-sm text-warm-700/60 font-medium">共 {totalPages} 页</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
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
