import { AppDashboard } from "@/components/app-dashboard"
import { getSessionUser } from "@/server-actions/session"
import { getUserUploadsSummary } from "@/server-actions/uploads"

export default async function AppPage() {
  const user = await getSessionUser()
  const pageSize = 12
  const data = user ? await getUserUploadsSummary(user.id, pageSize) : null
  const uploads = data?.uploads ?? []
  const total = data?.total ?? 0
  const styles = data?.styles ?? []
  const collections = data?.collections ?? []
  const uploadItems = uploads.map((upload) => ({
    id: upload.id,
    url: upload.url,
    prompt: upload.prompt,
    style: upload.style,
    tags: upload.tags,
    favorite: upload.favorite,
    collection: upload.collection,
    createdAt: upload.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-6xl mx-auto">
      <AppDashboard
        initialUploads={uploadItems}
        initialHasMore={pageSize < total}
        initialTotal={total}
        pageSize={pageSize}
        styles={styles}
        initialCollections={collections}
        showUploads={user?.plan?.hasImageStorage ?? false}
      />
    </div>
  )
}
