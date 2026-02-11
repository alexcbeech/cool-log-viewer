import { z } from 'zod'

export const configSchema = z.object({
  version: z.number().default(1),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  fontSize: z.number().min(8).max(32).default(13),
  fontFamily: z.string().default("'Cascadia Code', 'Consolas', 'Courier New', monospace"),
  maxLines: z.number().min(1000).max(1_000_000).default(100_000),
  highlightRules: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        pattern: z.string(),
        isRegex: z.boolean(),
        caseSensitive: z.boolean(),
        color: z.string(),
        backgroundColor: z.string(),
        enabled: z.boolean(),
        priority: z.number()
      })
    )
    .default([])
})

export type ConfigData = z.infer<typeof configSchema>

export const paneLeafSchema: z.ZodType<PaneLeafData> = z.object({
  type: z.literal('leaf'),
  id: z.string(),
  filePath: z.string().nullable()
})

interface PaneLeafData {
  type: 'leaf'
  id: string
  filePath: string | null
}

interface PaneSplitData {
  type: 'split'
  id: string
  direction: 'horizontal' | 'vertical'
  children: PaneNodeData[]
  sizes?: number[]
}

type PaneNodeData = PaneLeafData | PaneSplitData

export const paneNodeSchema: z.ZodType<PaneNodeData> = z.lazy(() =>
  z.discriminatedUnion('type', [
    paneLeafSchema,
    z.object({
      type: z.literal('split'),
      id: z.string(),
      direction: z.enum(['horizontal', 'vertical']),
      children: z.array(paneNodeSchema),
      sizes: z.array(z.number()).optional()
    })
  ])
)

export const sessionSchema = z.object({
  version: z.number().default(1),
  windowBounds: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number()
    })
    .optional(),
  paneLayout: paneNodeSchema.optional(),
  activePaneId: z.string().optional()
})

export type SessionData = z.infer<typeof sessionSchema>
