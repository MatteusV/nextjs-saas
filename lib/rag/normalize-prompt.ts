import { generateObject, gateway } from "ai"
import { z } from "zod"
import { RAG_LANGUAGE_MODEL } from "@/lib/rag/config"
import type { NormalizedPrompt } from "@/lib/rag/types"

const normalizationSchema = z.object({
  intent: z.string().min(1).optional(),
  style: z.string().min(1).optional(),
  emotion: z.string().min(1).optional(),
  visualTags: z.array(z.string().min(1)).max(12).default([]),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  normalizedText: z.string().min(1),
})

type NormalizePromptParams = {
  prompt: string
  style?: string | null
}

export async function normalizePrompt({
  prompt,
  style,
}: NormalizePromptParams): Promise<NormalizedPrompt> {
  const trimmedPrompt = prompt.trim()
  const trimmedStyle = style?.trim()
  const baseText = [trimmedPrompt, trimmedStyle && `Style: ${trimmedStyle}`]
    .filter(Boolean)
    .join(" | ")

  if (!baseText) {
    return {
      intent: null,
      style: trimmedStyle ?? null,
      emotion: null,
      visualTags: [],
      parameters: null,
      normalizedText: "",
    }
  }

  try {
    const result = await generateObject({
      model: gateway.languageModel(RAG_LANGUAGE_MODEL),
      schema: normalizationSchema,
      prompt: [
        "Extract the creative intent, style, emotion, and visual parameters from the user request.",
        "Return a concise normalizedText that describes the desired edit in a single sentence.",
        "Use short tags for visualTags (e.g. cinematic lighting, pastel palette, shallow depth).",
        "If the user provides a style name, keep it in style.",
        "Respond strictly following the schema.",
        `User request: ${baseText}`,
      ].join("\n"),
    })

    const value = result.object
    return {
      intent: value.intent ?? null,
      style: value.style ?? trimmedStyle ?? null,
      emotion: value.emotion ?? null,
      visualTags: value.visualTags ?? [],
      parameters: value.parameters ?? null,
      normalizedText: value.normalizedText,
    }
  } catch (error) {
    console.warn("[rag] Failed to normalize prompt, using fallback", error)
    return {
      intent: null,
      style: trimmedStyle ?? null,
      emotion: null,
      visualTags: [],
      parameters: null,
      normalizedText: baseText,
    }
  }
}
