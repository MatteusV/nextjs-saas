import { put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
  if (!match) return null
  return { mediaType: match[1], buffer: Buffer.from(match[2], "base64") }
}

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

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!user.plan?.hasImageStorage) {
    return Response.json({ error: "Seu plano não permite salvar imagens." }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: "Payload inválido" }, { status: 400 })
  }

  const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : ""
  const style = typeof body.style === "string" ? body.style.trim() : ""
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
  const collectionId = typeof body.collectionId === "string" ? body.collectionId : null
  const generationId = typeof body.generationId === "string" ? body.generationId : null

  if (!dataUrl) {
    return Response.json({ error: "Imagem inválida" }, { status: 400 })
  }

  const parsed = parseDataUrl(dataUrl)
  if (!parsed) {
    return Response.json({ error: "Formato de imagem inválido" }, { status: 400 })
  }

  const extension = getExtensionFromMediaType(parsed.mediaType)
  const blobPath = `user-uploads/${crypto.randomUUID()}.${extension}`
  const blob = await put(blobPath, parsed.buffer, {
    access: "public",
    contentType: parsed.mediaType,
    addRandomSuffix: true,
  })

  const upload = await prisma.userUpload.create({
    data: {
      userId: user.id,
      url: blob.url,
      style: style || null,
      prompt: prompt || null,
      collectionId,
    },
    include: {
      collection: { select: { id: true, name: true } },
    },
  })

  if (generationId) {
    await prisma.imageGeneration.update({
      where: { id: generationId },
      data: { userUploadId: upload.id },
    })
  }

  return Response.json({
    item: {
      id: upload.id,
      url: upload.url,
      prompt: upload.prompt,
      style: upload.style,
      tags: upload.tags,
      favorite: upload.favorite,
      collection: upload.collection,
      createdAt: upload.createdAt.toISOString(),
    },
  })
}
