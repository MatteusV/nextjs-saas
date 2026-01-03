export type NormalizedPrompt = {
  intent?: string | null
  style?: string | null
  emotion?: string | null
  visualTags: string[]
  parameters: Record<string, string | number | boolean> | null
  normalizedText: string
}

export type RagMatch = {
  content: string
  kind: "NORMALIZED_PROMPT" | "FINAL_PROMPT" | "VISUAL_TAG" | "FEEDBACK"
  score: number
  generationId?: string | null
}

export type RagContext = {
  userMatches: RagMatch[]
  globalMatches: RagMatch[]
  tagHints: string[]
  enrichedPrompt?: string
}
