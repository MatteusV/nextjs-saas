type GuidedPromptInput = {
  basePrompt?: string
  style?: string
  intent?: string
  emotion?: string
  lighting?: string
  palette?: string
  framing?: string
  details?: string
}

export function buildGuidedPrompt({
  basePrompt,
  style,
  intent,
  emotion,
  lighting,
  palette,
  framing,
  details,
}: GuidedPromptInput) {
  const parts: string[] = []

  if (basePrompt?.trim()) {
    parts.push(basePrompt.trim())
  }

  if (intent?.trim()) {
    parts.push(`Goal: ${intent.trim()}`)
  }

  if (emotion?.trim()) {
    parts.push(`Mood: ${emotion.trim()}`)
  }

  if (lighting?.trim()) {
    parts.push(`Lighting: ${lighting.trim()}`)
  }

  if (palette?.trim()) {
    parts.push(`Color palette: ${palette.trim()}`)
  }

  if (framing?.trim()) {
    parts.push(`Framing: ${framing.trim()}`)
  }

  if (details?.trim()) {
    parts.push(`Details: ${details.trim()}`)
  }

  if (style?.trim()) {
    parts.push(`Style: ${style.trim()}`)
  }

  return parts.filter(Boolean).join("\n")
}
