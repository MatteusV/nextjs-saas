import sharp from "sharp"
import { put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

const ASPECT_RATIOS: Record<string, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
  if (!match) return null
  return { mediaType: match[1], buffer: Buffer.from(match[2], "base64") }
}

async function loadSourceBuffer(sourceUrl?: string, dataUrl?: string) {
  if (dataUrl) {
    const parsed = parseDataUrl(dataUrl)
    if (!parsed) return null
    return parsed
  }

  if (sourceUrl) {
    const response = await fetch(sourceUrl)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") ?? "image/png"
    return { mediaType: contentType, buffer: Buffer.from(arrayBuffer) }
  }

  return null
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: "Payload inválido" }, { status: 400 })
  }

  const generationId = body.generationId as string | undefined
  const aspectRatio = body.aspectRatio as string | undefined
  const sourceUrl = body.sourceUrl as string | undefined
  const dataUrl = body.dataUrl as string | undefined

  if (!generationId || !aspectRatio) {
    return Response.json({ error: "generationId e aspectRatio são obrigatórios" }, { status: 400 })
  }

  const ratio = ASPECT_RATIOS[aspectRatio]
  if (!ratio) {
    return Response.json({ error: "aspectRatio inválido" }, { status: 400 })
  }

  const generation = await prisma.imageGeneration.findFirst({
    where: { id: generationId, userId: sessionUser.id },
  })
  if (!generation) {
    return Response.json({ error: "Geração não encontrada" }, { status: 404 })
  }

  const source = await loadSourceBuffer(sourceUrl, dataUrl)
  if (!source) {
    return Response.json({ error: "Imagem de origem inválida" }, { status: 400 })
  }

  try {
    const image = sharp(source.buffer)
    const metadata = await image.metadata()
    const width = metadata.width ?? 0
    const height = metadata.height ?? 0

    if (!width || !height) {
      return Response.json({ error: "Não foi possível ler a imagem" }, { status: 400 })
    }

    const currentRatio = width / height
    let targetWidth = width
    let targetHeight = height

    if (currentRatio > ratio) {
      targetWidth = Math.round(height * ratio)
      targetHeight = height
    } else {
      targetWidth = width
      targetHeight = Math.round(width / ratio)
    }

    const left = Math.max(0, Math.round((width - targetWidth) / 2))
    const top = Math.max(0, Math.round((height - targetHeight) / 2))

    const croppedBuffer = await image
      .extract({ left, top, width: targetWidth, height: targetHeight })
      .toBuffer()

    const outputDataUrl = `data:${source.mediaType};base64,${croppedBuffer.toString("base64")}`
    const shouldPersist = sessionUser.plan?.hasImageStorage ?? false

    if (!shouldPersist) {
      return Response.json({
        success: true,
        dataUrl: outputDataUrl,
      })
    }

    const blobPath = `user-derivatives/${crypto.randomUUID()}.png`
    const blob = await put(blobPath, croppedBuffer, {
      access: "public",
      contentType: source.mediaType,
      addRandomSuffix: true,
    })

    await prisma.imageDerivative.create({
      data: {
        userId: sessionUser.id,
        generationId: generation.id,
        kind: "CROP",
        aspectRatio,
        width: targetWidth,
        height: targetHeight,
        url: blob.url,
      },
    })

    return Response.json({
      success: true,
      dataUrl: outputDataUrl,
      blobUrl: blob.url,
    })
  } catch (error) {
    console.error("[crop] Failed to crop image", error)
    return Response.json({ error: "Erro ao gerar recorte" }, { status: 500 })
  }
}
