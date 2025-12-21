import { AppDashboard } from "@/components/app-dashboard"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

export default async function AppPage() {
  const user = await getSessionUser()
  const pageSize = 12
  const uploads = user
    ? await prisma.userUpload.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: pageSize,
      })
    : []

  const total = user
    ? await prisma.userUpload.count({
        where: { userId: user.id },
      })
    : 0

  const styles = user
    ? await prisma.userUpload.findMany({
        where: { userId: user.id, style: { not: null } },
        distinct: ["style"],
        select: { style: true },
      })
    : []

  const uploadItems = uploads.map((upload) => ({
    id: upload.id,
    url: upload.url,
    prompt: upload.prompt,
    style: upload.style,
    createdAt: upload.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-6xl mx-auto">
      <AppDashboard
        initialUploads={uploadItems}
        initialHasMore={pageSize < total}
        initialTotal={total}
        pageSize={pageSize}
        styles={styles.map((item) => item.style ?? "").filter(Boolean)}
        showUploads={user?.plan?.hasImageStorage ?? false}
      />
    </div>
  )
}
