"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { ImageStylizer } from "@/components/image-stylizer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadsPanel, type UploadsPanelProps } from "@/components/uploads-panel"

const TAB_VALUES = ["create", "uploads"] as const
type TabValue = (typeof TAB_VALUES)[number]

type AppDashboardProps = UploadsPanelProps & {
  showUploads?: boolean
}

export function AppDashboard({ showUploads = true, ...props }: AppDashboardProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab")
  const activeTab: TabValue = TAB_VALUES.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : "create"

  const resolvedTab = showUploads ? activeTab : "create"

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`/app?${params.toString()}`)
  }

  return (
    <Tabs value={resolvedTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList>
        <TabsTrigger value="create">Criar imagem</TabsTrigger>
        {showUploads ? <TabsTrigger value="uploads">Minhas imagens</TabsTrigger> : null}
      </TabsList>

      <TabsContent value="create">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">
              Personalize suas Imagens com IA
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Faça upload de uma foto e selecione um estilo para transformá-la com nosso modelo de
              machine learning
            </p>
          </div>

          <ImageStylizer />
        </div>
      </TabsContent>

      {showUploads ? (
        <TabsContent value="uploads">
          <UploadsPanel {...props} />
        </TabsContent>
      ) : null}
    </Tabs>
  )
}
