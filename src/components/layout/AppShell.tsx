import { type ReactNode, useState, useCallback, useRef, useEffect } from 'react'

interface AppShellProps {
  sidebar: ReactNode
  children: ReactNode
}

const MIN_WIDTH = 200
const MAX_WIDTH = 500
const DEFAULT_WIDTH = 300

export function AppShell({ sidebar, children }: AppShellProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [collapsed, setCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    setIsDragging(true)

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [sidebarWidth])

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  const effectiveWidth = collapsed ? 0 : sidebarWidth

  return (
    <div className="flex h-screen w-screen overflow-hidden relative">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className="h-full border-r border-cream-400/60 bg-cream-100 flex flex-col shrink-0 overflow-hidden"
        style={{
          width: effectiveWidth,
          transition: isDragging ? 'none' : 'width 200ms ease-out',
          borderRightWidth: collapsed ? 0 : undefined,
        }}
      >
        <div style={{ width: sidebarWidth, minWidth: sidebarWidth }} className="h-full">
          {sidebar}
        </div>
      </aside>

      {/* Resize handle */}
      {!collapsed && (
        <div
          ref={handleRef}
          onMouseDown={handleMouseDown}
          className="w-[5px] h-full cursor-col-resize shrink-0 relative group flex items-center justify-center"
        >
          <div className="absolute inset-y-0 -left-[3px] -right-[3px] z-10" />
          <div className="w-[3px] h-8 rounded-full bg-cream-400/0 group-hover:bg-sage-400/60 group-active:bg-sage-400 transition-colors" />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleCollapse}
        className="absolute top-4 z-20 w-6 h-12 bg-cream-200 border border-cream-400/60 rounded-r-lg flex items-center justify-center hover:bg-cream-300 transition-all"
        style={{
          left: collapsed ? 0 : effectiveWidth + 5,
          transition: isDragging ? 'none' : 'left 200ms ease-out',
        }}
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-warm-700 transition-transform ${collapsed ? '' : 'rotate-180'}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Main content */}
      <main className="flex-1 h-full overflow-auto bg-cream-50">
        {children}
      </main>

      {/* Drag overlay */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}
    </div>
  )
}
