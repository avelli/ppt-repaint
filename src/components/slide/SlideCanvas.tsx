interface SlideCanvasProps {
  title: string
  imageUrl?: string
  generationCount: number
}

export function SlideCanvas({ title, imageUrl, generationCount }: SlideCanvasProps) {
  return (
    <div className="flex flex-col h-full p-8">
      <header className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-warm-900 font-display">
          {title}
        </h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-[900px] aspect-[16/9] bg-white rounded-2xl shadow-lg border border-cream-300 overflow-hidden flex items-center justify-center">
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

          {/* Generation count badge */}
          {generationCount > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warm-900/70 text-white text-xs font-medium backdrop-blur-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="16" height="16" rx="2" />
                <rect x="6" y="6" width="16" height="16" rx="2" />
              </svg>
              <span>{generationCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
