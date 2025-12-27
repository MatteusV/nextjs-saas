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

  await prisma.collection.deleteMany({
    where: { id, userId: user.id },
  })

  return Response.json({ ok: true })
}
