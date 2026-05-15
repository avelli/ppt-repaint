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

export function SlideSidebar({ slides, totalPages, collapsed, onSlideSelect, onToggleCollapse }: SlideSidebarProps) {
  if (collapsed) {
    return (
      <div className={`flex flex-col h-full ${HEADER_PX} ${HEADER_PY}`}>
        <SidebarToggleButton collapsed onClick={onToggleCollapse} />
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
