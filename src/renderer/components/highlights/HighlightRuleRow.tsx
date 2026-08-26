import React from 'react'
import { Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '../common/Button'
import type { HighlightRule } from '../../types/highlight'
import { useHighlightStore } from '../../stores/highlight-store'

interface HighlightRuleRowProps {
  rule: HighlightRule
}

export const HighlightRuleRow: React.FC<HighlightRuleRowProps> = ({ rule }) => {
  const updateRule = useHighlightStore((s) => s.updateRule)
  const removeRule = useHighlightStore((s) => s.removeRule)

  return (
    <div className="flex items-center gap-2 py-1">
      <input
        type="color"
        value={rule.backgroundColor}
        onChange={(e) => updateRule(rule.id, { backgroundColor: e.target.value })}
        className="h-5 w-5 cursor-pointer rounded border-0"
        title="Background color"
      />
      <span
        className="flex-1 truncate text-xs font-mono"
        style={{
          backgroundColor: rule.backgroundColor,
          color: rule.color,
          padding: '1px 4px',
          borderRadius: '2px'
        }}
      >
        {rule.pattern}
      </span>
      {rule.isRegex && <span className="text-xs text-[var(--text-muted)]">regex</span>}
      <Button
        variant="icon"
        size="sm"
        onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
        title={rule.enabled ? 'Disable' : 'Enable'}
      >
        {rule.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
      </Button>
      <Button variant="icon" size="sm" onClick={() => removeRule(rule.id)} title="Delete">
        <Trash2 size={12} />
      </Button>
    </div>
  )
}
