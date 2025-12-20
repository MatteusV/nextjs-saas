import { put } from "@vercel/blob"
import { generateImage, gateway } from "ai"

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

    return { dataUrl, prompt, style, imageFile }
  } catch (error) {
    console.error("[API] Error processing image:", error)
    return Response.json(
      { error: "Erro ao processar imagem" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const data = await prepareEndpointForReceiveImage(request)
  if (data instanceof Response) {
    return data
  }
  const { dataUrl, prompt, style, imageFile } = data

  const modelId = process.env.AI_IMAGE_MODEL ?? "replicate/black-forest-labs/flux-1-schnell"
  const combinedPrompt = [prompt.trim(), style.trim() && `Estilo: ${style.trim()}`]
    .filter(Boolean)
    .join("\n")

  try {
    const result = await generateImage({
      model: gateway.imageModel(modelId),
      prompt: combinedPrompt,
    })

    const generatedImage = result.image
    const outputDataUrl = `data:${generatedImage.mediaType};base64,${generatedImage.base64}`

    const extension = getExtensionFromMediaType(generatedImage.mediaType)
    const blobPath = `user-uploads/${crypto.randomUUID()}.${extension}`
    void put(blobPath, Buffer.from(generatedImage.uint8Array), {
      access: "public",
      contentType: generatedImage.mediaType,
      addRandomSuffix: true,
    }).catch((error) => {
      console.error("[API] Error saving blob:", error)
    })

    return Response.json({
      success: true,
      message: "Imagem gerada com sucesso",
      imageSize: imageFile.size,
      imageType: imageFile.type,
      prompt: combinedPrompt,
      dataUrl: outputDataUrl,
      blobQueued: true,
    })
  } catch (error) {
    console.error("[API] Error generating image:", error)
    return Response.json(
      { error: "Erro ao gerar imagem com IA" },
      { status: 500 }
    )
  }
}
