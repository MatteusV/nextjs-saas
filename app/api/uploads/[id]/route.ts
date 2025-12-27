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
