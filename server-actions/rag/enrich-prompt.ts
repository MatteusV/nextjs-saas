import { generateText, gateway } from "ai"
import { RAG_LANGUAGE_MODEL } from "@/server-actions/rag/config"
import type { NormalizedPrompt, RagContext } from "@/server-actions/rag/types"

type EnrichPromptParams = {
  normalized: NormalizedPrompt
  context: RagContext
}

export async function enrichPrompt({
  normalized,
  context,
}: EnrichPromptParams): Promise<string> {
  const contextHints = [
    ...context.userMatches.map((match) => match.content),
    ...context.globalMatches.map((match) => match.content),
  ]
    .filter(Boolean)
    .slice(0, 6)

  const tagHints = context.tagHints.slice(0, 6)

  const prompt = [
    "You are preparing a concise technical prompt for an image editing model.",
    "Use the normalized intent as the source of truth.",
    "Add specific visual guidance and constraints, but do not add unrelated subjects.",
    "Keep the subject identity and composition consistent with the original photo.",
    "Output a single paragraph in English, no markdown, no lists.",
    "",
    `Normalized intent: ${normalized.normalizedText}`,
    normalized.style ? `Style: ${normalized.style}` : "",
    normalized.emotion ? `Emotion: ${normalized.emotion}` : "",
    normalized.visualTags.length
      ? `Visual tags: ${normalized.visualTags.join(", ")}`
      : "",
    tagHints.length ? `Similar tag hints: ${tagHints.join(", ")}` : "",
    contextHints.length
      ? `Relevant past edits: ${contextHints.join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  const result = await generateText({
    model: gateway.languageModel(RAG_LANGUAGE_MODEL),
    prompt,
  })

  return result.text.trim()
}
