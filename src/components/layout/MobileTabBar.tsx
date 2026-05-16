export type MobileTab = 'slides' | 'canvas' | 'edit'

interface MobileTabBarProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  slideCount: number
  isGenerating?: boolean
}

export function MobileTabBar({ activeTab, onTabChange, slideCount, isGenerating }: MobileTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center border-t border-cream-400/60 bg-cream-100/95 backdrop-blur-sm safe-area-bottom">
      <button
        onClick={() => onTabChange('slides')}
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
          activeTab === 'slides' ? 'text-sage-600' : 'text-warm-700/50'
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="text-[10px] font-medium">
          页面{slideCount > 0 && ` (${slideCount})`}
        </span>
      </button>

      <button
        onClick={() => onTabChange('canvas')}
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
          activeTab === 'canvas' ? 'text-sage-600' : 'text-warm-700/50'
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
        <span className="text-[10px] font-medium">预览</span>
      </button>

      <button
        onClick={() => onTabChange('edit')}
        className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
          activeTab === 'edit' ? 'text-sage-600' : 'text-warm-700/50'
        }`}
      >
        {isGenerating && (
          <span className="absolute right-1/4 top-1 h-2 w-2 rounded-full bg-sage-500 animate-pulse" />
        )}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span className="text-[10px] font-medium">编辑</span>
      </button>
    </nav>
  )
}
