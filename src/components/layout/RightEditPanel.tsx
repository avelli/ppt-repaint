interface RightEditPanelProps {
  collapsed: boolean
  onToggleCollapse: () => void
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

export function RightEditPanel({ collapsed, onToggleCollapse }: RightEditPanelProps) {
  if (collapsed) {
    return (
      <div className={`flex flex-col items-center h-full ${HEADER_PX} ${HEADER_PY}`}>
        <PanelToggleButton collapsed onClick={onToggleCollapse} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className={`flex items-center justify-between ${HEADER_PX} ${HEADER_PY} shrink-0`}>
        <span className="text-sm text-warm-700 font-medium">编辑</span>
        <PanelToggleButton collapsed={false} onClick={onToggleCollapse} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {/* 编辑模式 */}
        <section>
          <h3 className="text-xs text-warm-700/60 font-medium mb-2 uppercase tracking-wide">模式</h3>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 rounded-lg border border-sage-400 bg-sage-400/10 text-sm text-sage-700 font-medium transition-colors">
              整页重绘
            </button>
            <button className="flex-1 px-3 py-2 rounded-lg border border-cream-400 bg-cream-50 text-sm text-warm-700 font-medium hover:bg-cream-200 transition-colors">
              局部编辑
            </button>
          </div>
        </section>

        {/* 风格预设 */}
        <section>
          <h3 className="text-xs text-warm-700/60 font-medium mb-2 uppercase tracking-wide">风格</h3>
          <div className="grid grid-cols-2 gap-2">
            {['商务简约', '科技感', '学术严谨', '创意活泼'].map((style) => (
              <button
                key={style}
                className="px-3 py-2 rounded-lg border border-cream-400 bg-cream-50 text-sm text-warm-700 font-medium hover:bg-cream-200 transition-colors truncate"
              >
                {style}
              </button>
            ))}
          </div>
        </section>

        {/* 约束条件 */}
        <section>
          <h3 className="text-xs text-warm-700/60 font-medium mb-2 uppercase tracking-wide">约束</h3>
          <div className="flex flex-wrap gap-2">
            {['保留文字', '保留配色', '保留布局'].map((constraint) => (
              <button
                key={constraint}
                className="px-3 py-1.5 rounded-full border border-cream-400 bg-cream-50 text-xs text-warm-700 font-medium hover:bg-cream-200 transition-colors"
              >
                {constraint}
              </button>
            ))}
          </div>
        </section>

        {/* 编辑指令 */}
        <section className="flex-1 flex flex-col">
          <h3 className="text-xs text-warm-700/60 font-medium mb-2 uppercase tracking-wide">指令</h3>
          <textarea
            placeholder="描述你想要的修改效果..."
            className="flex-1 min-h-[120px] w-full rounded-xl border border-cream-400 bg-white px-4 py-3 text-sm text-warm-900 placeholder:text-cream-500 resize-none focus:outline-none focus:border-sage-400 transition-colors"
          />
        </section>

        {/* 生成按钮 */}
        <button className="w-full py-3 rounded-xl bg-sage-500 text-white font-medium text-sm hover:bg-sage-600 transition-colors">
          生成
        </button>
      </div>
    </div>
  )
}
