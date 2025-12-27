import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  await prisma.preset.deleteMany({
    where: { id, userId: sessionUser.id },
  })

  return Response.json({ success: true })
}
