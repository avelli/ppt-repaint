import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { SlideSidebar } from './components/layout/SlideSidebar'
import { RightEditPanel } from './components/layout/RightEditPanel'
import { SlideCanvas } from './components/slide/SlideCanvas'
import { useDeckStore } from './stores/deckStore'
import { useEditorStore } from './stores/editorStore'
import './App.css'

const DEMO_SLIDES = [
  { id: '1', deckId: 'demo', pageNumber: 1, title: '2026年国内短漫行业发展蓝皮书' },
  { id: '2', deckId: 'demo', pageNumber: 2, title: '行业核心结论总览' },
  { id: '3', deckId: 'demo', pageNumber: 3, title: '2026年短漫行业核心数据' },
  { id: '4', deckId: 'demo', pageNumber: 4, title: '漫剧赛道市场竞争格局' },
  { id: '5', deckId: 'demo', pageNumber: 5, title: '内容创作生态分析' },
  { id: '6', deckId: 'demo', pageNumber: 6, title: '用户画像与消费趋势' },
  { id: '7', deckId: 'demo', pageNumber: 7, title: '平台分发策略对比' },
  { id: '8', deckId: 'demo', pageNumber: 8, title: '投资建议与风险提示' },
]

function App() {
  const slides = useDeckStore((s) => s.slides)
  const setSlides = useDeckStore((s) => s.setSlides)
  const renameSlide = useDeckStore((s) => s.renameSlide)

  const currentSlideId = useEditorStore((s) => s.currentSlideId)
  const setCurrentSlideId = useEditorStore((s) => s.setCurrentSlideId)
  const editHistory = useEditorStore((s) => s.editHistory)
  const addEditTask = useEditorStore((s) => s.addEditTask)

  useEffect(() => {
    if (slides.length === 0) {
      setSlides(DEMO_SLIDES)
      setCurrentSlideId('1')
    }
  }, [slides.length, setSlides, setCurrentSlideId])

  const slidesWithState = slides.map((s) => ({
    ...s,
    isCurrent: s.id === currentSlideId,
    generationCount: (editHistory[s.id] ?? []).length,
  }))

  const currentSlide = slides.find((s) => s.id === currentSlideId)
  const currentTasks = currentSlideId ? (editHistory[currentSlideId] ?? []) : []

  const handleSubmitEdit = (prompt: string) => {
    if (!currentSlideId) return
    addEditTask(currentSlideId, { prompt, status: 'done' })
  }

  return (
    <AppShell
      sidebar={({ collapsed, onToggleCollapse }) => (
        <SlideSidebar
          slides={slidesWithState}
          totalPages={slides.length}
          collapsed={collapsed}
          onSlideSelect={setCurrentSlideId}
          onSlideRename={renameSlide}
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
      />
    </AppShell>
  )
}

export default App
