import { create } from 'zustand'
import type { HighlightRule, CompiledRule } from '../types/highlight'

let ruleCounter = 0
function generateRuleId(): string {
  return `rule-${++ruleCounter}`
}

interface HighlightStore {
  rules: HighlightRule[]
  compiledRules: CompiledRule[]

  addRule: (rule: Omit<HighlightRule, 'id' | 'priority'>) => void
  updateRule: (id: string, updates: Partial<HighlightRule>) => void
  removeRule: (id: string) => void
  reorderRules: (fromIndex: number, toIndex: number) => void
  setRules: (rules: HighlightRule[]) => void
}

function compileRules(rules: HighlightRule[]): CompiledRule[] {
  return rules
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority)
    .map((rule) => {
      try {
        const flags = rule.caseSensitive ? 'g' : 'gi'
        const pattern = rule.isRegex ? rule.pattern : escapeRegex(rule.pattern)
        return { rule, regex: new RegExp(pattern, flags) }
      } catch {
        return null
      }
    })
    .filter((r): r is CompiledRule => r !== null)
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const useHighlightStore = create<HighlightStore>((set) => ({
  rules: [],
  compiledRules: [],

  addRule: (rule) =>
    set((state) => {
      const newRule: HighlightRule = {
        ...rule,
        id: generateRuleId(),
        priority: state.rules.length
      }
      const rules = [...state.rules, newRule]
      return { rules, compiledRules: compileRules(rules) }
    }),

  updateRule: (id, updates) =>
    set((state) => {
      const rules = state.rules.map((r) => (r.id === id ? { ...r, ...updates } : r))
      return { rules, compiledRules: compileRules(rules) }
    }),

  removeRule: (id) =>
    set((state) => {
      const rules = state.rules.filter((r) => r.id !== id)
      return { rules, compiledRules: compileRules(rules) }
    }),

  reorderRules: (fromIndex, toIndex) =>
    set((state) => {
      const rules = [...state.rules]
      const [removed] = rules.splice(fromIndex, 1)
      rules.splice(toIndex, 0, removed)
      const reordered = rules.map((r, i) => ({ ...r, priority: rules.length - i }))
      return { rules: reordered, compiledRules: compileRules(reordered) }
    }),

  setRules: (rules) => set(() => ({ rules, compiledRules: compileRules(rules) }))
}))
