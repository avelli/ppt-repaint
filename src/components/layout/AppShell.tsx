import { type ReactNode, useState, useCallback, useRef } from 'react'

interface AppShellProps {
  sidebar: (props: { collapsed: boolean; onToggleCollapse: () => void }) => ReactNode
  children: ReactNode
}

const MIN_WIDTH = 200
const MAX_WIDTH = 500
const DEFAULT_WIDTH = 300
const COLLAPSED_WIDTH = 56

export function AppShell({ sidebar, children }: AppShellProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [collapsed, setCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

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

  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : sidebarWidth

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className="h-full border-r border-cream-400/60 bg-cream-100 flex flex-col shrink-0 overflow-hidden"
        style={{
          width: effectiveWidth,
          transition: isDragging ? 'none' : 'width 200ms ease-out',
        }}
      >
        <div style={{ width: collapsed ? COLLAPSED_WIDTH : sidebarWidth, minWidth: collapsed ? COLLAPSED_WIDTH : sidebarWidth }} className="h-full">
          {sidebar({ collapsed, onToggleCollapse: toggleCollapse })}
        </div>
      </aside>

      {/* Resize handle */}
      {!collapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="w-[5px] h-full cursor-col-resize shrink-0 relative group flex items-center justify-center"
        >
          <div className="absolute inset-y-0 -left-[3px] -right-[3px] z-10" />
          <div className="w-[3px] h-8 rounded-full bg-cream-400/0 group-hover:bg-sage-400/60 group-active:bg-sage-400 transition-colors" />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 h-full overflow-auto bg-cream-50">
        {children}
      </main>

      {/* Drag overlay */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}
    </div>
  )
}
