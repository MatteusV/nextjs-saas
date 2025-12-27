import { generateText, gateway } from "ai"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { incrementUserStylizeUsage } from "@/server-actions/usage"
import { normalizePrompt } from "@/lib/rag/normalize-prompt"
import { embedText } from "@/lib/rag/embeddings"
import { retrieveRagContext } from "@/lib/rag/retrieve-context"
import { enrichPrompt } from "@/lib/rag/enrich-prompt"
import { createGeneration, saveNormalization, updateGeneration } from "@/lib/rag/persist"
import { storeGenerationEmbeddings } from "@/lib/rag/learn"

const DEFAULT_IMAGE_EDITOR_PROMPT =
  "You are a professional photo editor. The user will describe the desired changes and style; apply them to the provided photo while keeping the subject recognizable. Preserve identity, proportions, and core features, avoid unwanted artifacts, and keep lighting, shadows, and color grading consistent with the requested style. Only edit what the user asks; do not add unrelated elements."

const MAX_VARIATIONS = 4

async function parseVariationRequest(request: Request) {
  const formData = await request.formData()
  const imageFile = formData.get("image")
  const generationId = formData.get("generationId")?.toString() || ""
  const countValue = Number(formData.get("count") ?? "3")

  if (!generationId) {
    return Response.json({ error: "generationId é obrigatório" }, { status: 400 })
  }

  if (!imageFile || !(imageFile instanceof File)) {
    return Response.json({ error: "Imagem é obrigatória" }, { status: 400 })
  }

  if (!imageFile.type.startsWith("image/")) {
    return Response.json({ error: "Arquivo deve ser uma imagem" }, { status: 400 })
  }

  const count = Math.min(Math.max(countValue || 3, 1), MAX_VARIATIONS)
  const arrayBuffer = await imageFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return { generationId, imageFile, imageBuffer: buffer, count }
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = await parseVariationRequest(request)
  if (parsed instanceof Response) {
    return parsed
  }

  const { generationId, imageFile, imageBuffer, count } = parsed
  const parentGeneration = await prisma.imageGeneration.findFirst({
    where: { id: generationId, userId: sessionUser.id },
  })

  if (!parentGeneration) {
    return Response.json({ error: "Geração não encontrada" }, { status: 404 })
  }

  const basePrompt = parentGeneration.finalPrompt ?? parentGeneration.rawPrompt
  const stylePrompt = parentGeneration.stylePrompt ?? null

  try {
    const normalized = await normalizePrompt({
      prompt: basePrompt,
      style: stylePrompt ?? undefined,
    })

    const queryEmbedding = await embedText(normalized.normalizedText)
    const ragContext = queryEmbedding
      ? await retrieveRagContext({
          userId: sessionUser.id,
          queryEmbedding,
        })
      : { userMatches: [], globalMatches: [], tagHints: [] }

    const enrichedPrompt = await enrichPrompt({
      normalized,
      context: ragContext,
    })

    const variations = [] as Array<{
      dataUrl: string
      generationId: string
      blobUrl: string | null
    }>

    for (let index = 0; index < count; index += 1) {
      const generation = await createGeneration({
        userId: sessionUser.id,
        rawPrompt: parentGeneration.rawPrompt,
        stylePrompt,
        inputImageType: imageFile.type,
        inputImageSize: imageFile.size,
        parentGenerationId: parentGeneration.id,
      })

      await saveNormalization({
        generationId: generation.id,
        normalized,
      })

      const result = await generateText({
        model: gateway.languageModel("google/gemini-2.5-flash-image-preview"),
        messages: [
          { role: "system", content: DEFAULT_IMAGE_EDITOR_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: enrichedPrompt || basePrompt },
              { type: "image", image: imageBuffer, mediaType: imageFile.type },
            ],
          },
        ],
      })

      const generatedImage = result.files?.[0]
      if (!generatedImage) {
        await updateGeneration({
          generationId: generation.id,
          status: "FAILED",
        })
        continue
      }

      const outputDataUrl = `data:${generatedImage.mediaType};base64,${generatedImage.base64}`
      await updateGeneration({
        generationId: generation.id,
        status: "COMPLETED",
        finalPrompt: basePrompt,
        modelUsed: "google/gemini-2.5-flash-image-preview",
        ragContext: {
          ...ragContext,
          enrichedPrompt,
        },
      })

      await storeGenerationEmbeddings({
        generationId: generation.id,
        userId: sessionUser.id,
        normalized,
        finalPrompt: basePrompt,
      })

      await incrementUserStylizeUsage({ userId: sessionUser.id })

      variations.push({
        dataUrl: outputDataUrl,
        generationId: generation.id,
      })
    }

    return Response.json({
      success: true,
      variations,
    })
  } catch (error) {
    console.error("[variations] Failed to generate variations", error)
    return Response.json({ error: "Erro ao gerar variações" }, { status: 500 })
  }
}
