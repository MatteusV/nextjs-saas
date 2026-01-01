import { prisma } from "@/lib/prisma"
import { getAdminUser } from "@/server-actions/admin"

function toCsv(rows: Array<Record<string, string | number | null>>) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escapeValue = (value: string | number | null) => {
    if (value == null) return ""
    const text = String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escapeValue(row[key])).join(",")),
  ]
  return lines.join("\n")
}

export async function GET(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return new Response("Unauthorized", { status: 401 })
  }

  const url = new URL(request.url)
  const kind = url.searchParams.get("kind") ?? "summary"

  if (kind === "summary") {
    const now = Date.now()
    const last30d = new Date(now - 1000 * 60 * 60 * 24 * 30)
    const last7d = new Date(now - 1000 * 60 * 60 * 24 * 7)
    const last24h = new Date(now - 1000 * 60 * 60 * 24)

    const [
      userTotal,
      activeSubscribers,
      generations30d,
      generations7d,
      generations24h,
      feedbackAvg,
      creditAgg,
      modelUsage,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { subscriptionPlan: { not: "FREE_TIER" } } }),
      prisma.imageGeneration.count({ where: { createdAt: { gte: last30d } } }),
      prisma.imageGeneration.count({ where: { createdAt: { gte: last7d } } }),
      prisma.imageGeneration.count({ where: { createdAt: { gte: last24h } } }),
      prisma.imageFeedback.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.creditPurchase.aggregate({
        where: { createdAt: { gte: last30d }, status: "COMPLETED" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.imageGeneration.groupBy({
        by: ["modelUsed"],
        _count: { _all: true },
        where: { createdAt: { gte: last30d } },
      }),
    ])

    const rows: Array<Record<string, string | number | null>> = [
      { section: "usuarios", metric: "total", value: userTotal },
      { section: "usuarios", metric: "assinantes_ativos", value: activeSubscribers },
      { section: "geracoes", metric: "30d", value: generations30d },
      { section: "geracoes", metric: "7d", value: generations7d },
      { section: "geracoes", metric: "24h", value: generations24h },
      {
        section: "feedback",
        metric: "media",
        value: feedbackAvg._avg.rating ? feedbackAvg._avg.rating.toFixed(2) : null,
      },
      { section: "feedback", metric: "total", value: feedbackAvg._count._all },
      { section: "creditos", metric: "compras_30d", value: creditAgg._count._all },
      { section: "creditos", metric: "receita_30d", value: creditAgg._sum.amount ?? 0 },
      ...modelUsage.map((item) => ({
        section: "modelo",
        metric: item.modelUsed ?? "desconhecido",
        value: item._count._all,
      })),
    ]

    return new Response(toCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="admin-summary.csv"`,
      },
    })
  }

  return new Response("Invalid export type", { status: 400 })
}
