interface SlideCanvasProps {
  title: string
  imageUrl?: string
  onImport?: () => void
  isEmpty?: boolean
}

export function SlideCanvas({ title, imageUrl, onImport, isEmpty }: SlideCanvasProps) {
  if (isEmpty) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-center max-w-md">
          <svg className="mx-auto mb-4" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" className="text-cream-400" />
            <circle cx="8.5" cy="8.5" r="1.5" className="text-cream-400" />
            <polyline points="21 15 16 10 5 21" className="text-cream-400" />
          </svg>
          <h2 className="text-xl font-semibold text-warm-800 mb-2 font-display">
            开始编辑你的 PPT
          </h2>
          <p className="text-sm text-warm-700/60 mb-6">
            导入 PPT 页面截图，通过 AI 进行美化、重绘和风格统一
          </p>
          {onImport && (
            <button
              onClick={onImport}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sage-500 text-white font-medium hover:bg-sage-600 transition-colors shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              导入图片
            </button>
          )}
          <p className="text-xs text-warm-700/40 mt-3">
            支持 PNG、JPEG、WebP、GIF、BMP 格式，单文件最大 50MB
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-8">
      <header className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-warm-900 font-display">
          {title}
        </h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div
          className="w-full max-w-[900px] aspect-[16/9] bg-white rounded-2xl shadow-lg border border-cream-300 overflow-hidden flex items-center justify-center"
          data-ctx-area="canvas"
          data-ctx-src={imageUrl || ''}
        >
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
              <p className="text-sm">加载中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
