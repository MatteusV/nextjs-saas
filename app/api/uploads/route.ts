import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseNumber(searchParams.get("page"), 1))
  const pageSize = Math.min(24, Math.max(6, parseNumber(searchParams.get("pageSize"), 12)))
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest"
  const style = searchParams.get("style")?.trim() || null
  const query = searchParams.get("q")?.trim() || null
  const range = searchParams.get("range")?.trim() || "all"

  const where: {
    userId: string
    style?: string
    prompt?: { contains: string; mode: "insensitive" }
    createdAt?: { gte: Date }
  } = { userId: user.id }

  if (style) {
    where.style = style
  }

  if (query) {
    where.prompt = { contains: query, mode: "insensitive" }
  }

  if (range === "7d" || range === "30d" || range === "90d") {
    const days = Number(range.replace("d", ""))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    where.createdAt = { gte: startDate }
  }

  const [total, uploads] = await Promise.all([
    prisma.userUpload.count({ where }),
    prisma.userUpload.findMany({
      where,
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const items = uploads.map((upload) => ({
    id: upload.id,
    url: upload.url,
    prompt: upload.prompt,
    style: upload.style,
    createdAt: upload.createdAt.toISOString(),
  }))

  return Response.json({
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  })
}
