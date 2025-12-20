import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return Response.json({ error: "Missing token or email" }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      verifiedAt: true,
      verificationToken: true,
      verificationTokenExpires: true,
    },
  })

  if (!user) {
    return Response.json({ error: "Invalid token" }, { status: 400 })
  }

  if (user.verifiedAt) {
    return Response.json({ verified: true })
  }

  if (!user.verificationToken || user.verificationToken !== token) {
    return Response.json({ error: "Invalid token" }, { status: 400 })
  }

  if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
    return Response.json({ error: "Token expired" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpires: null,
    },
  })

  return Response.json({ verified: true })
}
