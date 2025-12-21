import { put } from "@vercel/blob"
import { generateText, gateway } from "ai"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { incrementUserStylizeUsage } from "@/server-actions/usage"

const DEFAULT_IMAGE_EDITOR_PROMPT =
  "You are a professional photo editor. The user will describe the desired changes and style; apply them to the provided photo while keeping the subject recognizable. Preserve identity, proportions, and core features, avoid unwanted artifacts, and keep lighting, shadows, and color grading consistent with the requested style. Only edit what the user asks; do not add unrelated elements."

function getExtensionFromMediaType(mediaType: string) {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  }
  return map[mediaType] ?? "png"
}

async function prepareEndpointForReceiveImage(request: Request) {
  try {
    const formData = await request.formData()
    
    const imageFile = formData.get("image")
    const prompt = formData.get("prompt")?.toString() || ""
    const style = formData.get("style")?.toString() || ""

    // Validate image file
    if (!imageFile || !(imageFile instanceof File)) {
      return Response.json(
        { error: "Imagem é obrigatória e deve ser um arquivo válido" },
        { status: 400 }
      )
    }

    // Validate prompt/style
    if (!prompt.trim() && !style.trim()) {
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

    return { dataUrl, prompt, style, imageFile, imageBuffer: buffer }
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
  const { prompt, style, imageFile, imageBuffer } = data

  const combinedPrompt = [prompt.trim(), style.trim() && `Estilo: ${style.trim()}`]
    .filter(Boolean)
    .join("\n")
  const shouldPersist = sessionUser.plan?.hasImageStorage ?? false

  try {
    const result = await generateText({
      model: gateway.languageModel("google/gemini-2.5-flash-image-preview"),
      messages: [
        { role: "system", content: DEFAULT_IMAGE_EDITOR_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: combinedPrompt },
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

    const outputDataUrl = `data:${generatedImage.mediaType};base64,${generatedImage.base64}`
    let blobUrl: string | null = null
    if (shouldPersist) {
      const extension = getExtensionFromMediaType(generatedImage.mediaType)
      const blobPath = `user-uploads/${crypto.randomUUID()}.${extension}`
      const blob = await put(blobPath, Buffer.from(generatedImage.uint8Array), {
        access: "public",
        contentType: generatedImage.mediaType,
        addRandomSuffix: true,
      })
      blobUrl = blob.url

      await prisma.userUpload.create({
        data: {
          userId: sessionUser.id,
          url: blob.url,
          style: style.trim() || null,
          prompt: combinedPrompt || null,
        },
      })
    }

    await incrementUserStylizeUsage({ userId: sessionUser.id })

    return Response.json({
      success: true,
      message: "Imagem gerada com sucesso",
      imageSize: imageFile.size,
      imageType: imageFile.type,
      prompt: combinedPrompt,
      dataUrl: outputDataUrl,
      blobQueued: shouldPersist,
      blobUrl,
    })
  } catch (error) {
    console.error("[API] Error generating image:", error)
    return Response.json(
      { error: "Erro ao gerar imagem com IA" },
      { status: 500 }
    )
  }
}
