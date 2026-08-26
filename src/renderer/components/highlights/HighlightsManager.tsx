import React, { useState } from 'react'
import { Plus, X, Highlighter } from 'lucide-react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Toggle } from '../common/Toggle'
import { HighlightRuleRow } from './HighlightRuleRow'
import { useHighlightStore } from '../../stores/highlight-store'

interface HighlightsManagerProps {
  isOpen: boolean
  onClose: () => void
}

export const HighlightsManager: React.FC<HighlightsManagerProps> = ({ isOpen, onClose }) => {
  const rules = useHighlightStore((s) => s.rules)
  const addRule = useHighlightStore((s) => s.addRule)
  const [newPattern, setNewPattern] = useState('')
  const [newIsRegex, setNewIsRegex] = useState(false)

  if (!isOpen) return null

  const handleAdd = (): void => {
    if (!newPattern.trim()) return
    addRule({
      label: newPattern,
      pattern: newPattern,
      isRegex: newIsRegex,
      caseSensitive: true,
      color: '#ffffff',
      backgroundColor: randomColor(),
      enabled: true
    })
    setNewPattern('')
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Highlighter size={14} />
          <span className="text-sm font-medium">Highlight Rules</span>
        </div>
        <Button variant="icon" size="sm" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>
      <div className="max-h-48 overflow-y-auto px-3 py-2">
        {rules.map((rule) => (
          <HighlightRuleRow key={rule.id} rule={rule} />
        ))}
        {rules.length === 0 && (
          <p className="py-2 text-center text-xs text-[var(--text-muted)]">
            No highlight rules. Add one below.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--border-primary)] px-3 py-2">
        <Input
          value={newPattern}
          onChange={(e) => setNewPattern(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Pattern..."
          className="flex-1"
        />
        <Toggle pressed={newIsRegex} onPressedChange={setNewIsRegex} title="Regex">
          <span className="text-xs">.*</span>
        </Toggle>
        <Button variant="ghost" size="sm" onClick={handleAdd}>
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f43f5e'
]

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}
