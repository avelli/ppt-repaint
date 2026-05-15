import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { SlideSidebar } from './components/layout/SlideSidebar'
import { SlideCanvas } from './components/slide/SlideCanvas'
import './App.css'

const mockSlides = [
  { id: '1', pageNumber: 1, title: '2026年国内短漫行业发展蓝皮书', isCurrent: true },
  { id: '2', pageNumber: 2, title: '行业核心结论总览', isCurrent: false },
  { id: '3', pageNumber: 3, title: '2026年短漫行业核心数据', isCurrent: false },
  { id: '4', pageNumber: 4, title: '漫剧赛道市场竞争格局', isCurrent: false },
  { id: '5', pageNumber: 5, title: '内容创作生态分析', isCurrent: false },
  { id: '6', pageNumber: 6, title: '用户画像与消费趋势', isCurrent: false },
  { id: '7', pageNumber: 7, title: '平台分发策略对比', isCurrent: false },
  { id: '8', pageNumber: 8, title: '投资建议与风险提示', isCurrent: false },
]

function App() {
  const [currentSlideId, setCurrentSlideId] = useState('1')

  const slides = mockSlides.map((s) => ({
    ...s,
    isCurrent: s.id === currentSlideId,
  }))

  const currentSlide = slides.find((s) => s.id === currentSlideId)

  return (
    <AppShell
      sidebar={({ collapsed, onToggleCollapse }) => (
        <SlideSidebar
          slides={slides}
          totalPages={slides.length}
          collapsed={collapsed}
          onSlideSelect={setCurrentSlideId}
          onToggleCollapse={onToggleCollapse}
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
