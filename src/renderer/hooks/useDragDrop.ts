import { useState, useCallback, type DragEvent } from 'react'

interface DragDropResult {
  isDragOver: boolean
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
}

export function useDragDrop(onFileDrop: (filePath: string) => void): DragDropResult {
  const [isDragOver, setIsDragOver] = useState(false)

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.path) {
          onFileDrop(file.path)
        }
      }
    },
    [onFileDrop]
  )

  return { isDragOver, onDragOver, onDragLeave, onDrop }
}
