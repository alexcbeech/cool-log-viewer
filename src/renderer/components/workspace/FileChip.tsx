import React from 'react'
import { FileText } from 'lucide-react'

interface FileChipProps {
  filePath: string
  isActive: boolean
  onClick: () => void
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath
}

export const FileChip: React.FC<FileChipProps> = ({ filePath, isActive, onClick }) => {
  return (
    <button
      className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors ${
        isActive
          ? 'bg-[var(--bg-active)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
      }`}
      onClick={onClick}
      title={filePath}
    >
      <FileText size={12} />
      <span className="max-w-[150px] truncate">{getFileName(filePath)}</span>
    </button>
  )
}
