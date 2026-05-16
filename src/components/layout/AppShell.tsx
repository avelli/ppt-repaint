import { type ReactNode, useState, useCallback } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { MobileTabBar, type MobileTab } from './MobileTabBar'

interface AppShellProps {
  sidebar: (props: { collapsed: boolean; onToggleCollapse: () => void }) => ReactNode
  rightPanel: (props: { collapsed: boolean; onToggleCollapse: () => void }) => ReactNode
  children: ReactNode
  slideCount?: number
  isGenerating?: boolean
}

const LEFT_MIN_WIDTH = 200
const LEFT_MAX_WIDTH = 500
const LEFT_DEFAULT_WIDTH = 300
const LEFT_COLLAPSED_WIDTH = 60

const RIGHT_MIN_WIDTH = 280
const RIGHT_MAX_WIDTH = 520
const RIGHT_DEFAULT_WIDTH = 360
const RIGHT_COLLAPSED_WIDTH = 60

function useResizable(defaultWidth: number, minWidth: number, maxWidth: number) {
  const [width, setWidth] = useState(defaultWidth)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent, direction: 'left' | 'right') => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width

    setIsDragging(true)

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = direction === 'left'
        ? ev.clientX - startX
        : startX - ev.clientX
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, minWidth, maxWidth])

  return { width, setWidth, isDragging, handleMouseDown }
}

function MobileShell({ sidebar, rightPanel, children, slideCount = 0, isGenerating }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('canvas')

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'slides' && (
          <div className="h-full overflow-auto bg-cream-100">
            {sidebar({ collapsed: false, onToggleCollapse: () => setActiveTab('canvas') })}
          </div>
        )}
        {activeTab === 'canvas' && (
          <main className="h-full overflow-auto bg-cream-50">
            {children}
          </main>
        )}
        {activeTab === 'edit' && (
          <div className="h-full overflow-auto bg-cream-100">
            {rightPanel({ collapsed: false, onToggleCollapse: () => setActiveTab('canvas') })}
          </div>
        )}
      </div>
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        slideCount={slideCount}
        isGenerating={isGenerating}
      />
    </div>
  )
}

function DesktopShell({ sidebar, rightPanel, children }: AppShellProps) {
  const left = useResizable(LEFT_DEFAULT_WIDTH, LEFT_MIN_WIDTH, LEFT_MAX_WIDTH)
  const right = useResizable(RIGHT_DEFAULT_WIDTH, RIGHT_MIN_WIDTH, RIGHT_MAX_WIDTH)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  const leftEffectiveWidth = leftCollapsed ? LEFT_COLLAPSED_WIDTH : left.width
  const rightEffectiveWidth = rightCollapsed ? RIGHT_COLLAPSED_WIDTH : right.width
  const anyDragging = left.isDragging || right.isDragging

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Sidebar */}
      <aside
        className="h-full border-r border-cream-400/60 bg-cream-100 flex flex-col shrink-0 overflow-hidden"
        style={{
          width: leftEffectiveWidth,
          transition: anyDragging ? 'none' : 'width 200ms ease-out',
        }}
      >
        <div style={{ width: leftCollapsed ? LEFT_COLLAPSED_WIDTH : left.width, minWidth: leftCollapsed ? LEFT_COLLAPSED_WIDTH : left.width }} className="h-full">
          {sidebar({ collapsed: leftCollapsed, onToggleCollapse: () => setLeftCollapsed(prev => !prev) })}
        </div>
      </aside>

      {/* Left Resize Handle */}
      {!leftCollapsed && (
        <div
          onMouseDown={(e) => left.handleMouseDown(e, 'left')}
          className="w-[5px] h-full cursor-col-resize shrink-0 relative group flex items-center justify-center"
        >
          <div className="absolute inset-y-0 -left-[3px] -right-[3px] z-10" />
          <div className="w-[3px] h-8 rounded-full bg-cream-400/0 group-hover:bg-sage-400/60 group-active:bg-sage-400 transition-colors" />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-auto bg-cream-50">
        {children}
      </main>

      {/* Right Resize Handle */}
      {!rightCollapsed && (
        <div
          onMouseDown={(e) => right.handleMouseDown(e, 'right')}
          className="w-[5px] h-full cursor-col-resize shrink-0 relative group flex items-center justify-center"
        >
          <div className="absolute inset-y-0 -left-[3px] -right-[3px] z-10" />
          <div className="w-[3px] h-8 rounded-full bg-cream-400/0 group-hover:bg-sage-400/60 group-active:bg-sage-400 transition-colors" />
        </div>
      )}

      {/* Right Panel */}
      <aside
        className="h-full border-l border-cream-400/60 bg-cream-100 flex flex-col shrink-0 overflow-hidden"
        style={{
          width: rightEffectiveWidth,
          transition: anyDragging ? 'none' : 'width 200ms ease-out',
        }}
      >
        <div style={{ width: rightCollapsed ? RIGHT_COLLAPSED_WIDTH : right.width, minWidth: rightCollapsed ? RIGHT_COLLAPSED_WIDTH : right.width }} className="h-full">
          {rightPanel({ collapsed: rightCollapsed, onToggleCollapse: () => setRightCollapsed(prev => !prev) })}
        </div>
      </aside>

      {/* Drag Overlay */}
      {anyDragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}
    </div>
  )
}

export function AppShell(props: AppShellProps) {
  const isMobile = useIsMobile()
  return isMobile ? <MobileShell {...props} /> : <DesktopShell {...props} />
}
