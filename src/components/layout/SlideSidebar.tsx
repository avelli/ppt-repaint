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
  onToggleCollapse: () => void
}

export function SlideSidebar({ slides, totalPages, collapsed, onSlideSelect, onToggleCollapse }: SlideSidebarProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center h-full py-4">
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-full border border-cream-400 bg-cream-50 flex items-center justify-center hover:bg-cream-200 transition-colors"
          aria-label="展开侧边栏"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-700">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-5 py-4 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-full border border-cream-400 bg-cream-50 flex items-center justify-center hover:bg-cream-200 transition-colors"
          aria-label="收起侧边栏"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-700 rotate-180">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
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
              <div className="aspect-[16/9] bg-white rounded-xl m-1 overflow-hidden flex items-center justify-center">
                {slide.thumbnailUrl ? (
                  <img
                    src={slide.thumbnailUrl}
                    alt={`第 ${slide.pageNumber} 页`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-cream-500 text-sm">暂无预览</div>
                )}
              </div>
            </button>
            <div className="flex items-center gap-2 mt-2 px-1">
              <span className="text-sm text-warm-700/60 font-medium">P{slide.pageNumber}</span>
              {slide.isCurrent && (
                <span className="text-xs px-2 py-0.5 rounded bg-sage-400 text-white font-medium">
                  当前
                </span>
              )}
            </div>
            {slide.title && (
              <p className="text-sm text-warm-800 font-medium mt-0.5 px-1 truncate">
                {slide.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
