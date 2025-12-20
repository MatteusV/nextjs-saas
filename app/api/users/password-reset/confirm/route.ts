import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { token, password } = parsed.data

  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token },
    select: { id: true, passwordResetTokenExpires: true },
  })

  if (!user) {
    return Response.json({ error: "Invalid token" }, { status: 400 })
  }

  if (user.passwordResetTokenExpires && user.passwordResetTokenExpires < new Date()) {
    return Response.json({ error: "Token expired" }, { status: 400 })
  }

  const hashedPassword = await hash(password, 6)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
    },
  })

  return Response.json({ ok: true })
}
