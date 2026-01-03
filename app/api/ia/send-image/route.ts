import { generateText, gateway } from "ai"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { consumeStylizeUsage } from "@/server-actions/usage"
import { applyWatermark } from "@/server-actions/images/watermark"
import { normalizePrompt } from "@/server-actions/rag/normalize-prompt"
import { embedText } from "@/server-actions/rag/embeddings"
import { retrieveRagContext } from "@/server-actions/rag/retrieve-context"
import { enrichPrompt } from "@/server-actions/rag/enrich-prompt"
import { createGeneration, saveNormalization, updateGeneration } from "@/server-actions/rag/persist"
import { storeGenerationEmbeddings } from "@/server-actions/rag/learn"
import { buildGuidedPrompt } from "@/server-actions/prompt/guided"

const DEFAULT_IMAGE_EDITOR_PROMPT =
  "You are a professional photo editor. The user will describe the desired changes and style; apply them to the provided photo while keeping the subject recognizable. Preserve identity, proportions, and core features, avoid unwanted artifacts, and keep lighting, shadows, and color grading consistent with the requested style. Only edit what the user asks; do not add unrelated elements."

async function prepareEndpointForReceiveImage(request: Request) {
  try {
    const formData = await request.formData()
    
    const imageFile = formData.get("image")
    const prompt = formData.get("prompt")?.toString() || ""
    const style = formData.get("style")?.toString() || ""
    const guidedIntent = formData.get("guidedIntent")?.toString() || ""
    const guidedEmotion = formData.get("guidedEmotion")?.toString() || ""
    const guidedLighting = formData.get("guidedLighting")?.toString() || ""
    const guidedPalette = formData.get("guidedPalette")?.toString() || ""
    const guidedFraming = formData.get("guidedFraming")?.toString() || ""
    const guidedDetails = formData.get("guidedDetails")?.toString() || ""

    // Validate image file
    if (!imageFile || !(imageFile instanceof File)) {
      return Response.json(
        { error: "Imagem é obrigatória e deve ser um arquivo válido" },
        { status: 400 }
      )
    }

    const hasGuidedFields = [
      guidedIntent,
      guidedEmotion,
      guidedLighting,
      guidedPalette,
      guidedFraming,
      guidedDetails,
    ].some((value) => value.trim())

    // Validate prompt/style
    if (!prompt.trim() && !style.trim() && !hasGuidedFields) {
      return Response.json(
        { error: "Prompt ou style é obrigatório" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return Response.json(
        { error: "Arquivo deve ser uma imagem" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      return Response.json(
        { error: "Imagem muito grande. Tamanho máximo: 10MB" },
        { status: 400 }
      )
    }

    // Convert image to base64 for API processing
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`

    return {
      dataUrl,
      prompt,
      style,
      imageFile,
      imageBuffer: buffer,
      guidedIntent,
      guidedEmotion,
      guidedLighting,
      guidedPalette,
      guidedFraming,
      guidedDetails,
    }
  } catch (error) {
    console.error("[API] Error processing image:", error)
    return Response.json(
      { error: "Erro ao processar imagem" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await prepareEndpointForReceiveImage(request)
  if (data instanceof Response) {
    return data
  }
  const {
    prompt,
    style,
    imageFile,
    imageBuffer,
    guidedIntent,
    guidedEmotion,
    guidedLighting,
    guidedPalette,
    guidedFraming,
    guidedDetails,
  } = data

  const usageResult = await consumeStylizeUsage({ userId: sessionUser.id, amount: 1 })
  if (!usageResult.allowed) {
    return Response.json(
      {
        error: "Limite de gerações atingido",
        code: "LIMIT_REACHED",
        upgradeUrl: "/app/plans",
        canBuyCredits: Boolean(
          sessionUser.plan?.creditPackPriceId && sessionUser.plan?.creditPackAmount
        ),
        usageLimit: usageResult.usageLimit,
        remaining: usageResult.remaining,
      },
      { status: 402 }
    )
  }

  const guidedPrompt = buildGuidedPrompt({
    basePrompt: prompt,
    style,
    intent: guidedIntent,
    emotion: guidedEmotion,
    lighting: guidedLighting,
    palette: guidedPalette,
    framing: guidedFraming,
    details: guidedDetails,
  })

  const combinedPrompt =
    guidedPrompt ||
    [prompt.trim(), style.trim() && `Estilo: ${style.trim()}`].filter(Boolean).join("\n")

  let generationId: string | null = null

  try {
    const generation = await createGeneration({
      userId: sessionUser.id,
      rawPrompt: prompt.trim(),
      stylePrompt: style.trim() || null,
      inputImageType: imageFile.type,
      inputImageSize: imageFile.size,
    })
    generationId = generation.id

    const normalized = await normalizePrompt({
      prompt: guidedPrompt || prompt,
      style,
    })

    await saveNormalization({
      generationId: generation.id,
      normalized,
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
    const finalPrompt = combinedPrompt || normalized.normalizedText || prompt.trim()

    const result = await generateText({
      model: gateway.languageModel("google/gemini-2.5-flash-image-preview"),
      messages: [
        { role: "system", content: DEFAULT_IMAGE_EDITOR_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: finalPrompt },
            { type: "image", image: imageBuffer, mediaType: imageFile.type },
          ],
        },
      ],
    })

    const generatedImage = result.files?.[0]
    if (!generatedImage) {
      return Response.json(
        { error: "Modelo não retornou imagem gerada" },
        { status: 500 }
      )
    }

    const watermarkText = sessionUser.plan?.watermarkText ?? "AI Stylizer"
    const shouldWatermark = Boolean(sessionUser.plan?.watermarkEnabled)

    const outputBase64 = shouldWatermark
      ? (await applyWatermark({
          base64: generatedImage.base64,
          mediaType: generatedImage.mediaType,
          text: watermarkText,
        })).base64
      : generatedImage.base64

    const outputDataUrl = `data:${generatedImage.mediaType};base64,${outputBase64}`
    await updateGeneration({
      generationId: generation.id,
      status: "COMPLETED",
      finalPrompt,
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
      finalPrompt,
    })

    return Response.json({
      success: true,
      message: "Imagem gerada com sucesso",
      imageSize: imageFile.size,
      imageType: imageFile.type,
      prompt: finalPrompt,
      generationId: generation.id,
      dataUrl: outputDataUrl,
      canSave: sessionUser.plan?.hasImageStorage ?? false,
    })
  } catch (error) {
    console.error("[rag] Failed to generate image", error)
    if (generationId) {
      await updateGeneration({
        generationId,
        status: "FAILED",
      })
    }
    console.error("[API] Error generating image:", error)
    return Response.json(
      { error: "Erro ao gerar imagem com IA" },
      { status: 500 }
    )
  }
}
