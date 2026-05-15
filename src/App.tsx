import { useEffect, useRef, useCallback } from 'react'
import { AppShell } from './components/layout/AppShell'
import { SlideSidebar } from './components/layout/SlideSidebar'
import { RightEditPanel } from './components/layout/RightEditPanel'
import { SlideCanvas } from './components/slide/SlideCanvas'
import { useDeckStore } from './stores/deckStore'
import { useEditorStore } from './stores/editorStore'
import { importImages, SUPPORTED_IMAGE_TYPES } from './services/importer/importImages'
import './App.css'

function App() {
  const decks = useDeckStore((s) => s.decks)
  const currentDeckId = useDeckStore((s) => s.currentDeckId)
  const slides = useDeckStore((s) => s.slides)
  const isLoading = useDeckStore((s) => s.isLoading)
  const loadDecks = useDeckStore((s) => s.loadDecks)
  const createDeck = useDeckStore((s) => s.createDeck)
  const setCurrentDeckId = useDeckStore((s) => s.setCurrentDeckId)
  const loadSlidesForDeck = useDeckStore((s) => s.loadSlidesForDeck)
  const loadSlideImage = useDeckStore((s) => s.loadSlideImage)
  const renameSlide = useDeckStore((s) => s.renameSlide)
  const cleanup = useDeckStore((s) => s.cleanup)

  const currentSlideId = useEditorStore((s) => s.currentSlideId)
  const setCurrentSlideId = useEditorStore((s) => s.setCurrentSlideId)
  const editHistory = useEditorStore((s) => s.editHistory)
  const addEditTask = useEditorStore((s) => s.addEditTask)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDecks()
    return () => cleanup()
  }, [loadDecks, cleanup])

  useEffect(() => {
    if (!currentDeckId && decks.length > 0) {
      setCurrentDeckId(decks[0].id)
    }
  }, [decks, currentDeckId, setCurrentDeckId])

  useEffect(() => {
    if (currentDeckId) {
      loadSlidesForDeck(currentDeckId)
    }
  }, [currentDeckId, loadSlidesForDeck])

  useEffect(() => {
    if (slides.length > 0 && !currentSlideId) {
      setCurrentSlideId(slides[0].id)
    }
  }, [slides, currentSlideId, setCurrentSlideId])

  const currentSlide = slides.find((s) => s.id === currentSlideId)

  useEffect(() => {
    if (currentSlideId) {
      loadSlideImage(currentSlideId)
    }
  }, [currentSlideId, loadSlideImage])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleNewProject = useCallback(async () => {
    const deck = await createDeck('未命名演示文稿')
    setCurrentDeckId(deck.id)
  }, [createDeck, setCurrentDeckId])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const deckId = await importImages(fileArray, {
      deckId: currentDeckId ?? undefined,
    })

    await loadDecks()
    setCurrentDeckId(deckId)
    await loadSlidesForDeck(deckId)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [currentDeckId, loadDecks, setCurrentDeckId, loadSlidesForDeck])

  const handleSlideSelect = useCallback((id: string) => {
    setCurrentSlideId(id)
  }, [setCurrentSlideId])

  const slidesWithState = slides.map((s) => ({
    ...s,
    isCurrent: s.id === currentSlideId,
    generationCount: (editHistory[s.id] ?? []).length,
  }))

  const currentTasks = currentSlideId ? (editHistory[currentSlideId] ?? []) : []

  const handleSubmitEdit = (prompt: string) => {
    if (!currentSlideId) return
    addEditTask(currentSlideId, { prompt, status: 'done' })
  }

  const acceptTypes = Array.from(SUPPORTED_IMAGE_TYPES).join(',')

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <AppShell
        sidebar={({ collapsed, onToggleCollapse }) => (
          <SlideSidebar
            slides={slidesWithState}
            totalPages={slides.length}
            collapsed={collapsed}
            onSlideSelect={handleSlideSelect}
            onSlideRename={renameSlide}
            onToggleCollapse={onToggleCollapse}
            onImport={handleImport}
            onNewProject={handleNewProject}
            isLoading={isLoading}
            decks={decks}
            currentDeckId={currentDeckId}
            onDeckSelect={setCurrentDeckId}
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
          title={currentSlide?.title ?? '导入图片开始编辑'}
          imageUrl={currentSlide?.imageUrl}
          onImport={handleImport}
          isEmpty={slides.length === 0}
        />
      </AppShell>
    </>
  )
}

export default App
