import { useState, useRef, useEffect, useCallback } from 'react'
import type { Deck } from '../../types/deck'

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
  onReorderSlides: (fromIndex: number, toIndex: number) => void
  onInsertIndexChange?: (index: number | null) => void
  onToggleCollapse: () => void
  onImport?: () => void
  onImportPdf?: () => void
  onExportPptx?: () => void
  onNewProject?: () => void
  isLoading?: boolean
  pdfProgress?: { current: number; total: number } | null
  exportProgress?: { current: number; total: number } | null
  decks?: Deck[]
  currentDeckId?: string | null
  onDeckSelect?: (id: string) => void
  onDeckRename?: (newTitle: string) => void
  onDeckDelete?: () => void
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

function ImportPdfButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border border-sage-400 bg-sage-50 flex items-center justify-center hover:bg-sage-100 transition-colors"
      aria-label="导入 PDF"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-600">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9 15 12 12 15 15" />
      </svg>
    </button>
  )
}

function ExportPptxButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border border-cream-400 bg-cream-50 flex items-center justify-center hover:bg-cream-200 transition-colors"
      aria-label="导出 PPTX"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-700">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
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

interface DeckTitleBarProps {
  title: string
  decks?: Deck[]
  currentDeckId?: string | null
  onDeckSelect?: (id: string) => void
  onRename?: (newTitle: string) => void
  onDelete?: () => void
}

function DeckTitleBar({ title, decks, currentDeckId, onDeckSelect, onRename, onDelete }: DeckTitleBarProps) {
  const [editing, setEditing] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const toggleBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setValue(title)
  }, [title])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    if (!selecting) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(target)
      ) {
        setSelecting(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selecting])

  const commit = () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== title && onRename) {
      onRename(trimmed)
    } else {
      setValue(title)
    }
  }

  return (
    <div className="relative flex items-center gap-1.5 px-3 py-2 shrink-0 border-b border-cream-300/60">
      {onDeckSelect && decks && (
        <button
          ref={toggleBtnRef}
          onClick={() => setSelecting((v) => !v)}
          className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
            selecting
              ? 'text-sage-600 bg-cream-200'
              : 'text-warm-700/40 hover:text-sage-600 hover:bg-cream-200'
          }`}
          aria-label="切换项目"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 10 12 5 17 10" />
            <polyline points="7 14 12 19 17 14" />
          </svg>
        </button>
      )}
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setValue(title); setEditing(false) }
          }}
          className="flex-1 min-w-0 text-sm text-warm-800 font-semibold bg-white border border-sage-400 rounded-lg px-2 py-1 outline-none"
        />
      ) : (
        <p className="flex-1 min-w-0 text-sm text-warm-900 font-semibold truncate">
          {title}
        </p>
      )}
      {onRename && (
        <button
          onClick={() => { setEditing(true); setValue(title) }}
          className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-warm-700/40 hover:text-sage-600 hover:bg-cream-200 transition-colors"
          aria-label="重命名项目"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-warm-700/40 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="删除项目"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}
      {decks && onDeckSelect && (
        <div
          ref={dropdownRef}
          className={`absolute top-full left-[34px] right-[68px] mt-1 bg-white border border-cream-300 rounded-xl shadow-lg z-20 py-1 max-h-60 overflow-y-auto transition-all duration-200 origin-top ${
            selecting
              ? 'opacity-100 scale-y-100 pointer-events-auto'
              : 'opacity-0 scale-y-90 pointer-events-none'
          }`}
        >
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => { onDeckSelect(deck.id); setSelecting(false) }}
              className={`w-full text-left pl-[13px] pr-3 py-2 text-sm transition-colors ${
                deck.id === currentDeckId
                  ? 'bg-sage-100 text-sage-700 font-medium'
                  : 'text-warm-800 hover:bg-cream-100'
              }`}
            >
              {deck.title}
            </button>
          ))}
        </div>
      )}
    </div>
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

export function SlideSidebar({ slides, totalPages, collapsed, onSlideSelect, onSlideRename, onReorderSlides, onInsertIndexChange, onToggleCollapse, onImport, onImportPdf, onExportPptx, onNewProject, isLoading, pdfProgress, exportProgress, decks, currentDeckId, onDeckSelect, onDeckRename, onDeckDelete }: SlideSidebarProps) {
  const currentDeck = decks?.find((d) => d.id === currentDeckId)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const handleSlideClick = useCallback((id: string) => {
    onSlideSelect(id)
  }, [onSlideSelect])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIndex === null) return
    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const target = e.clientY < midY ? index : index + 1
    setDropIndex(target === dragIndex || target === dragIndex + 1 ? null : target)
  }, [dragIndex])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (dragIndex !== null && dropIndex !== null) {
      const to = dropIndex > dragIndex ? dropIndex - 1 : dropIndex
      onReorderSlides(dragIndex, to)
    }
    setDragIndex(null)
    setDropIndex(null)
  }, [dragIndex, dropIndex, onReorderSlides])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDropIndex(null)
  }, [])

  if (collapsed) {
    return (
      <div className={`flex flex-col items-center h-full ${HEADER_PX} ${HEADER_PY} gap-2`}>
        <SidebarToggleButton collapsed onClick={onToggleCollapse} />
        <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto scrollbar-hide flex-1 min-h-0" style={{ scrollbarWidth: 'none' }}>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => onSlideSelect(slide.id)}
              className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center text-xs font-medium transition-colors ${
                slide.isCurrent
                  ? 'border-sage-400 bg-sage-400 text-white'
                  : 'border-cream-400 bg-cream-50 text-warm-700 hover:bg-cream-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className={`flex items-center ${HEADER_PX} ${HEADER_PY} shrink-0`}>
        <div className="flex items-center gap-2">
          <SidebarToggleButton collapsed={false} onClick={onToggleCollapse} />
          {onNewProject && <NewProjectButton onClick={onNewProject} />}
          {onImport && <ImportButton onClick={onImport} />}
          {onImportPdf && <ImportPdfButton onClick={onImportPdf} />}
          {onExportPptx && <ExportPptxButton onClick={onExportPptx} />}
        </div>
      </header>

      {pdfProgress && (
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center justify-between text-xs text-warm-700/70 mb-1">
            <span>导入 PDF 中...</span>
            <span>{pdfProgress.current}/{pdfProgress.total}</span>
          </div>
          <div className="w-full h-1.5 bg-cream-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(pdfProgress.current / pdfProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {exportProgress && (
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center justify-between text-xs text-warm-700/70 mb-1">
            <span>导出 PPT 中...</span>
            <span>{exportProgress.current}/{exportProgress.total}</span>
          </div>
          <div className="w-full h-1.5 bg-cream-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {currentDeck && (
        <DeckTitleBar
          title={currentDeck.title}
          decks={decks}
          currentDeckId={currentDeckId}
          onDeckSelect={onDeckSelect}
          onRename={onDeckRename}
          onDelete={onDeckDelete}
        />
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 scrollbar-styled">
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
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="group"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            {/* 间隙指示区 */}
            <div className="relative h-3 ml-[26px] group/gap">
              <div className={`absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 rounded-full transition-colors ${
                dropIndex === index
                  ? 'bg-sage-500'
                  : 'bg-transparent group-hover/gap:bg-cream-400'
              }`} />
            </div>
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 w-5 text-xs text-warm-700/50 font-medium text-right pt-1">
                {index + 1}
              </span>
              <button
                onClick={() => handleSlideClick(slide.id)}
                className={`flex-1 min-w-0 rounded-2xl overflow-hidden border-2 transition-all ${
                  slide.isCurrent
                    ? 'border-sage-400 shadow-md'
                    : 'border-transparent hover:border-cream-400 hover:shadow-sm'
                } ${dragIndex === index ? 'opacity-40' : ''}`}
              >
                <div
                  className="aspect-[16/9] bg-cream-100 overflow-hidden flex items-center justify-center relative"
                  data-ctx-area="sidebar"
                  data-ctx-src={slide.thumbnailUrl || ''}
                  data-ctx-slide-id={slide.id}
                >
                  {slide.thumbnailUrl ? (
                    <img
                      src={slide.thumbnailUrl}
                      alt={`第 ${index + 1} 页`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-cream-500 text-sm">暂无预览</div>
                  )}
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
            </div>
          </div>
        ))}
        {/* 末尾间隙 */}
        <div className="relative h-3 ml-[26px] group/gap">
          <div className={`absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 rounded-full transition-colors ${
            dropIndex === slides.length
              ? 'bg-sage-500'
              : 'bg-transparent group-hover/gap:bg-cream-400'
          }`} />
        </div>
      </div>
      {slides.length > 0 && (
        <div className="shrink-0 border-t border-cream-300/60 px-3 py-1 flex items-center">
          <span className="text-xs text-warm-700/50 font-medium">
            {slides.findIndex((s) => s.isCurrent) + 1}/{slides.length}
          </span>
        </div>
      )}
    </div>
  )
}

