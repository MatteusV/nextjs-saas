import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { emailChangeToken: token },
    select: {
      id: true,
      pendingEmail: true,
      emailChangeTokenExpires: true,
    },
  })

  if (!user || !user.pendingEmail) {
    return Response.json({ error: "Invalid token" }, { status: 400 })
  }

  if (user.emailChangeTokenExpires && user.emailChangeTokenExpires < new Date()) {
    return Response.json({ error: "Token expired" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeTokenExpires: null,
      verifiedAt: new Date(),
    },
    select: { id: true, email: true },
  })

  return Response.json({ ok: true, user: updated })
}
