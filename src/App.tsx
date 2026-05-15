import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { AppShell } from './components/layout/AppShell'
import { SlideSidebar } from './components/layout/SlideSidebar'
import { RightEditPanel } from './components/layout/RightEditPanel'
import type { SlideCandidate } from './components/layout/RightEditPanel'
import { SlideCanvas } from './components/slide/SlideCanvas'
import { ApiSettingsModal } from './components/editor/ApiSettingsModal'
import { ImageContextMenu } from './components/ui/ImageContextMenu'
import { useDeckStore } from './stores/deckStore'
import { useEditorStore } from './stores/editorStore'
import { useSettingsStore } from './stores/settingsStore'
import { useGenerationStore } from './stores/generationStore'
import { OpenAIImageProvider } from './services/image/openaiImageProvider'
import { ImageEditService } from './services/image/imageEditService'
import { assetRepository } from './services/storage/assetRepository'
import { slideRepository } from './services/storage/slideRepository'
import { importImages, SUPPORTED_IMAGE_TYPES } from './services/importer/importImages'
import { importPdf } from './services/importer/importPdf'
import { exportPptx } from './services/export/exportPptx'

function App() {
  const decks = useDeckStore((s) => s.decks)
  const currentDeckId = useDeckStore((s) => s.currentDeckId)
  const slides = useDeckStore((s) => s.slides)
  const isLoading = useDeckStore((s) => s.isLoading)
  const loadDecks = useDeckStore((s) => s.loadDecks)
  const createDeck = useDeckStore((s) => s.createDeck)
  const updateDeck = useDeckStore((s) => s.updateDeck)
  const deleteDeck = useDeckStore((s) => s.deleteDeck)
  const setCurrentDeckId = useDeckStore((s) => s.setCurrentDeckId)
  const loadSlidesForDeck = useDeckStore((s) => s.loadSlidesForDeck)
  const loadSlideImage = useDeckStore((s) => s.loadSlideImage)
  const renameSlide = useDeckStore((s) => s.renameSlide)
  const selectSlideCandidate = useDeckStore((s) => s.selectSlideCandidate)
  const getOriginalAssetId = useDeckStore((s) => s.getOriginalAssetId)
  const cleanup = useDeckStore((s) => s.cleanup)

  const currentSlideId = useEditorStore((s) => s.currentSlideId)
  const setCurrentSlideId = useEditorStore((s) => s.setCurrentSlideId)
  const editHistory = useEditorStore((s) => s.editHistory)
  const addEditTask = useEditorStore((s) => s.addEditTask)
  const updateEditTaskStatus = useEditorStore((s) => s.updateEditTaskStatus)
  const completeEditTask = useEditorStore((s) => s.completeEditTask)

  const isGenerating = useGenerationStore((s) => s.isGenerating)
  const startGeneration = useGenerationStore((s) => s.startGeneration)
  const setProgress = useGenerationStore((s) => s.setProgress)
  const setError = useGenerationStore((s) => s.setError)
  const finishGeneration = useGenerationStore((s) => s.finishGeneration)

  const apiKey = useSettingsStore((s) => s.apiKey)
  const baseUrl = useSettingsStore((s) => s.baseUrl)
  const model = useSettingsStore((s) => s.model)
  const apiMode = useSettingsStore((s) => s.apiMode)
  const quality = useSettingsStore((s) => s.quality)
  const size = useSettingsStore((s) => s.size)
  const outputFormat = useSettingsStore((s) => s.outputFormat)
  const moderation = useSettingsStore((s) => s.moderation)
  const timeout = useSettingsStore((s) => s.timeout)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [originalAssetInfo, setOriginalAssetInfo] = useState<{ assetId: string; thumbnailUrl?: string } | null>(null)
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null)
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!currentSlideId) return
    getOriginalAssetId(currentSlideId).then(async (assetId) => {
      if (!assetId) {
        setOriginalAssetInfo(null)
        return
      }
      const thumb = await assetRepository.getThumbnail(assetId)
      const thumbnailUrl = thumb ? URL.createObjectURL(thumb.blob) : undefined
      setOriginalAssetInfo({ assetId, thumbnailUrl })
    })
    return () => { setOriginalAssetInfo(null) }
  }, [currentSlideId, getOriginalAssetId])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportPdf = useCallback(() => {
    pdfInputRef.current?.click()
  }, [])

  const handleExportPptx = useCallback(async () => {
    if (!currentDeckId) return
    try {
      const blob = await exportPptx(currentDeckId, setExportProgress)
      setExportProgress(null)
      const deck = decks.find((d) => d.id === currentDeckId)
      const filename = `${deck?.title ?? '演示文稿'}.pptx`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportProgress(null)
      alert(err instanceof Error ? err.message : '导出失败')
    }
  }, [currentDeckId, decks])

  const handleNewProject = useCallback(async () => {
    const deck = await createDeck('未命名演示文稿')
    setCurrentDeckId(deck.id)
  }, [createDeck, setCurrentDeckId])

  const handleDeckRename = useCallback(async (newTitle: string) => {
    if (!currentDeckId) return
    const deck = decks.find((d) => d.id === currentDeckId)
    if (!deck) return
    await updateDeck({ ...deck, title: newTitle })
  }, [currentDeckId, decks, updateDeck])

  const handleDeckDelete = useCallback(async () => {
    if (!currentDeckId) return
    const deck = decks.find((d) => d.id === currentDeckId)
    const title = deck?.title ?? '此项目'
    const confirmed = window.confirm(`确定要删除「${title}」吗？该项目下的所有幻灯片将被永久删除。`)
    if (!confirmed) return
    await deleteDeck(currentDeckId)
  }, [currentDeckId, decks, deleteDeck])

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

  const handlePdfChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setPdfProgress({ current: 0, total: 1 })
      const deckId = await importPdf(file, {
        onProgress: (current, total) => setPdfProgress({ current, total }),
      })
      await loadDecks()
      setCurrentDeckId(deckId)
      await loadSlidesForDeck(deckId)
    } catch (err) {
      alert(err instanceof Error ? err.message : '导入 PDF 失败')
    } finally {
      setPdfProgress(null)
    }

    if (pdfInputRef.current) {
      pdfInputRef.current.value = ''
    }
  }, [loadDecks, setCurrentDeckId, loadSlidesForDeck])

  const handleSlideSelect = useCallback((id: string) => {
    setCurrentSlideId(id)
  }, [setCurrentSlideId])

  const handleSelectCandidate = useCallback(async (candidate: SlideCandidate) => {
    if (!currentSlideId || !candidate.assetId || candidate.isSelected) return
    await selectSlideCandidate(currentSlideId, candidate.assetId)
  }, [currentSlideId, selectSlideCandidate])

  const slidesWithState = slides.map((s) => ({
    ...s,
    isCurrent: s.id === currentSlideId,
    generationCount: (editHistory[s.id] ?? []).length,
  }))

  const candidates: SlideCandidate[] = useMemo(() => {
    if (!currentSlide) return []

    const tasks = currentSlideId ? (editHistory[currentSlideId] ?? []) : []
    const list: SlideCandidate[] = []

    if (originalAssetInfo) {
      list.push({
        id: 'original',
        number: 1,
        assetId: originalAssetInfo.assetId,
        thumbnailUrl: originalAssetInfo.thumbnailUrl,
        prompt: '',
        isOriginal: true,
        isSelected: currentSlide.currentAssetId === originalAssetInfo.assetId,
      })
    }

    const doneTasks = tasks.filter((t) => t.status === 'done' && t.resultAssetId)
    const generatingTasks = tasks.filter((t) => t.status === 'generating')
    const errorTasks = tasks.filter((t) => t.status === 'error')

    doneTasks.forEach((task) => {
      list.push({
        id: task.id,
        number: list.length + 1,
        assetId: task.resultAssetId!,
        thumbnailUrl: task.thumbnailUrl,
        prompt: task.prompt,
        isOriginal: false,
        isSelected: currentSlide.currentAssetId === task.resultAssetId,
        status: 'done',
      })
    })

    generatingTasks.forEach((task) => {
      list.push({
        id: task.id,
        number: list.length + 1,
        assetId: '',
        thumbnailUrl: undefined,
        prompt: task.prompt,
        isOriginal: false,
        isSelected: false,
        status: 'generating',
      })
    })

    errorTasks.forEach((task) => {
      list.push({
        id: task.id,
        number: list.length + 1,
        assetId: '',
        thumbnailUrl: undefined,
        prompt: task.prompt,
        isOriginal: false,
        isSelected: false,
        status: 'error',
      })
    })

    return list
  }, [currentSlide, originalAssetInfo, currentSlideId, editHistory])

  const handleSubmitEdit = useCallback(async (prompt: string) => {
    if (!currentSlideId || !currentSlide) return

    if (!apiKey) {
      setSettingsOpen(true)
      return
    }

    const taskId = addEditTask(currentSlideId, { prompt, status: 'generating' })

    const controller = startGeneration()
    setProgress('正在调用 AI 编辑...')

    try {
      let imageBlob: Blob

      if (currentSlide.currentAssetId) {
        const asset = await assetRepository.get(currentSlide.currentAssetId)
        if (asset) {
          imageBlob = asset.blob
        } else {
          throw new Error('当前幻灯片没有可编辑的图片')
        }
      } else if (currentSlide.imageUrl) {
        const resp = await fetch(currentSlide.imageUrl)
        imageBlob = await resp.blob()
      } else {
        throw new Error('当前幻灯片没有可编辑的图片')
      }

      const provider = new OpenAIImageProvider({ apiKey, baseUrl, model, timeout, apiMode })
      const editService = new ImageEditService({
        provider,
        assetRepository,
        slideRepository,
      })

      const result = await editService.editSlideImage({
        slideId: currentSlideId,
        image: imageBlob,
        prompt,
        quality,
        size,
        outputFormat,
        moderation,
        signal: controller.signal,
      })

      finishGeneration()

      const thumb = await assetRepository.getThumbnail(result.assetId)
      const thumbnailUrl = thumb ? URL.createObjectURL(thumb.blob) : undefined
      completeEditTask(currentSlideId, taskId, result.assetId, thumbnailUrl ?? '')

      if (result.revisedPrompt) {
        setProgress('')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败'
      if (err instanceof DOMException && err.name === 'AbortError') {
        updateEditTaskStatus(currentSlideId, taskId, 'error')
        finishGeneration()
        return
      }
      setError(message)
      updateEditTaskStatus(currentSlideId, taskId, 'error')
    }
  }, [
    currentSlideId, currentSlide, apiKey, baseUrl, model, apiMode, quality, size, outputFormat, moderation, timeout,
    addEditTask, startGeneration, setProgress, finishGeneration, setError,
    updateEditTaskStatus, completeEditTask,
  ])

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
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        onChange={handlePdfChange}
        className="hidden"
      />
      <ApiSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ImageContextMenu />
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
            onImportPdf={handleImportPdf}
            onExportPptx={handleExportPptx}
            onNewProject={handleNewProject}
            isLoading={isLoading}
            pdfProgress={pdfProgress}
            exportProgress={exportProgress}
            decks={decks}
            currentDeckId={currentDeckId}
            onDeckSelect={setCurrentDeckId}
            onDeckRename={handleDeckRename}
            onDeckDelete={handleDeckDelete}
          />
        )}
        rightPanel={({ collapsed, onToggleCollapse }) => (
          <RightEditPanel
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            candidates={candidates}
            onSelectCandidate={handleSelectCandidate}
            onSubmit={handleSubmitEdit}
            onOpenSettings={() => setSettingsOpen(true)}
            isGenerating={isGenerating}
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
