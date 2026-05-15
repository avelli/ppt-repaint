import { useState, useCallback } from 'react'
import { AppShell } from './components/layout/AppShell'
import { SlideSidebar } from './components/layout/SlideSidebar'
import { RightEditPanel, type EditTask } from './components/layout/RightEditPanel'
import { SlideCanvas } from './components/slide/SlideCanvas'
import './App.css'

const initialSlides = [
  { id: '1', pageNumber: 1, title: '2026年国内短漫行业发展蓝皮书' },
  { id: '2', pageNumber: 2, title: '行业核心结论总览' },
  { id: '3', pageNumber: 3, title: '2026年短漫行业核心数据' },
  { id: '4', pageNumber: 4, title: '漫剧赛道市场竞争格局' },
  { id: '5', pageNumber: 5, title: '内容创作生态分析' },
  { id: '6', pageNumber: 6, title: '用户画像与消费趋势' },
  { id: '7', pageNumber: 7, title: '平台分发策略对比' },
  { id: '8', pageNumber: 8, title: '投资建议与风险提示' },
]

function App() {
  const [currentSlideId, setCurrentSlideId] = useState('1')
  const [slideTitles, setSlideTitles] = useState<Record<string, string>>(
    Object.fromEntries(initialSlides.map((s) => [s.id, s.title]))
  )
  const [editHistory, setEditHistory] = useState<Record<string, EditTask[]>>({})

  const slides = initialSlides.map((s) => ({
    ...s,
    title: slideTitles[s.id] ?? s.title,
    isCurrent: s.id === currentSlideId,
  }))

  const currentSlide = slides.find((s) => s.id === currentSlideId)
  const currentTasks = editHistory[currentSlideId] ?? []

  const handleSubmitEdit = useCallback((prompt: string) => {
    const newTask: EditTask = {
      id: `${currentSlideId}-${Date.now()}`,
      prompt,
      status: 'done',
      createdAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setEditHistory((prev) => ({
      ...prev,
      [currentSlideId]: [newTask, ...(prev[currentSlideId] ?? [])],
    }))
  }, [currentSlideId])

  const handleSlideRename = useCallback((id: string, newTitle: string) => {
    setSlideTitles((prev) => ({ ...prev, [id]: newTitle }))
  }, [])

  return (
    <AppShell
      sidebar={({ collapsed, onToggleCollapse }) => (
        <SlideSidebar
          slides={slides}
          totalPages={slides.length}
          collapsed={collapsed}
          onSlideSelect={setCurrentSlideId}
          onSlideRename={handleSlideRename}
          onToggleCollapse={onToggleCollapse}
        />
      )}
      rightPanel={({ collapsed, onToggleCollapse }) => (
        <RightEditPanel
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          slideTitle={currentSlide?.title ?? '未命名'}
          tasks={currentTasks}
          onSubmit={handleSubmitEdit}
        />
      )}
    >
      <SlideCanvas
        title={currentSlide?.title ?? '未命名演示文稿'}
        generationCount={currentTasks.length}
      />
    </AppShell>
  )
}

export default App
