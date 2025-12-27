import { del } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const upload = await prisma.userUpload.findFirst({
    where: { id, userId: user.id },
    select: { id: true, url: true },
  })

  if (!upload) {
    return Response.json({ error: "Upload not found" }, { status: 404 })
  }

  try {
    await del(upload.url)
  } catch (error) {
    console.error("[uploads] Failed to delete blob:", error)
    return Response.json({ error: "Falha ao remover o arquivo no Blob" }, { status: 500 })
  }

  await prisma.userUpload.delete({ where: { id: upload.id } })

  return Response.json({ ok: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: "Payload inválido" }, { status: 400 })
  }

  const favorite =
    typeof body.favorite === "boolean" ? body.favorite : undefined
  const collectionId =
    typeof body.collectionId === "string" ? body.collectionId : body.collectionId === null ? null : undefined
  const tagsInput = Array.isArray(body.tags) ? body.tags : undefined
  const tags = tagsInput
    ? tagsInput.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
    : undefined

  const upload = await prisma.userUpload.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })

  if (!upload) {
    return Response.json({ error: "Upload not found" }, { status: 404 })
  }

  const updated = await prisma.userUpload.update({
    where: { id },
    data: {
      favorite: favorite ?? undefined,
      collectionId,
      tags: tags ?? undefined,
    },
    include: {
      collection: { select: { id: true, name: true } },
    },
  })

  return Response.json({
    item: {
      id: updated.id,
      url: updated.url,
      prompt: updated.prompt,
      style: updated.style,
      tags: updated.tags,
      favorite: updated.favorite,
      collection: updated.collection,
      createdAt: updated.createdAt.toISOString(),
    },
  })
}
