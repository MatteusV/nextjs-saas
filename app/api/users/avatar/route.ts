import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/server-actions/session"
import { prisma } from "@/lib/prisma"

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const avatarFile = formData.get("avatar")

    if (!avatarFile || !(avatarFile instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo de avatar é obrigatório" },
        { status: 400 }
      )
    }

    if (!avatarFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Arquivo deve ser uma imagem" },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (avatarFile.size > maxSize) {
      return NextResponse.json(
        { error: "Imagem muito grande. Tamanho máximo: 5MB" },
        { status: 400 }
      )
    }

    const arrayBuffer = await avatarFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const extension = getExtensionFromMediaType(avatarFile.type)
    const blobPath = `avatars/${user.id}.${extension}`

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: avatarFile.type,
      allowOverwrite: true,
      cacheControlMaxAge: 3600,
    })

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: blob.url },
      select: { id: true, avatarUrl: true },
    })

    const timestamp = Date.now()
    const avatarUrlWithCacheBust = `${blob.url}?v=${timestamp}`

    return NextResponse.json({
      success: true,
      avatarUrl: avatarUrlWithCacheBust,
    })
  } catch (error) {
    console.error("[API] Error uploading avatar:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload da foto de perfil" },
      { status: 500 }
    )
  }
}
