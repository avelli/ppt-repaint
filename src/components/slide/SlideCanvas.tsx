interface SlideCanvasProps {
  title: string
  imageUrl?: string
  onInspectClick?: () => void
}

export function SlideCanvas({ title, imageUrl }: SlideCanvasProps) {
  return (
    <div className="flex flex-col h-full p-8">
      <header className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-warm-900 font-display">
          {title}
        </h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[900px] aspect-[16/9] bg-white rounded-2xl shadow-lg border border-cream-300 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="当前幻灯片"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-cream-500">
              <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm">选择一页幻灯片开始编辑</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
