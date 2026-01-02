"use client"

import { useEffect, useState } from "react"
import { BarChart3, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const MEDIA_PLACEHOLDER = "Sem legenda"
const METRIC_LABELS: Record<string, string> = {
  reach: "Alcance",
  saved: "Salvos",
  likes: "Curtidas",
  comments: "Comentários",
  shares: "Compartilhamentos",
  replies: "Respostas",
  video_views: "Visualizações do vídeo",
  plays: "Reproduções",
  impressions: "Impressões",
  total_interactions: "Interações totais",
  follows: "Novos seguidores",
  profile_visits: "Visitas ao perfil",
  profile_activity: "Atividade no perfil",
  navigation: "Navegação",
  views: "Visualizações",
  reposts: "Reposts",
  facebook_views: "Visualizações no Facebook",
  crossposted_views: "Visualizações cruzadas",
  ig_reels_video_view_total_time: "Tempo total de visualização",
  ig_reels_avg_watch_time: "Tempo médio assistido",
  ig_reels_aggregated_all_plays_count: "Reproduções totais",
  clips_replays_count: "Replays",
  reels_skip_rate: "Taxa de pulo",
}

type InstagramMediaItem = {
  id: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  timestamp?: string
  permalink?: string
}

type InsightItem = {
  name: string
  value: number
}

type InsightsMap = Record<string, InsightItem[]>

type InstagramInsightsCardProps = {
  isConnected: boolean
}

export function InstagramInsightsCard({ isConnected }: InstagramInsightsCardProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<InstagramMediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<InsightsMap>({})

  async function loadMedia() {
    if (!isConnected) return
    setLoading(true)
    try {
      const response = await fetch("/api/integrations/instagram/media")
      const data = await response.json()
      if (!response.ok) {
        throw new Error("Não foi possível carregar os posts agora.")
      }
      setItems(data.items ?? [])
    } catch (error) {
      toast({
        title: "Não foi possível carregar os posts",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadInsights(mediaId: string, mediaType?: string) {
    try {
      const params = new URLSearchParams({ mediaId })
      if (mediaType) {
        params.set("mediaType", mediaType)
      }

      const response = await fetch(`/api/integrations/instagram/insights?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? "Não foi possível carregar os insights agora.")
      }

      const formatted: InsightItem[] = (data.insights ?? []).map((item: any) => ({
        name: METRIC_LABELS[item.name] ?? item.name,
        value: item.values?.[0]?.value ?? 0,
      }))

      setInsights((prev) => ({
        ...prev,
        [mediaId]: formatted,
      }))
    } catch (error) {
      toast({
        title: "Insights indisponíveis",
        description: error instanceof Error ? error.message : "Aguarde alguns minutos e tente novamente.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadMedia()
  }, [isConnected])

  return (
    <Card className="shadow-xl border-border/50 bg-card/95">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <BarChart3 className="h-5 w-5 text-primary" />
          Analisar posts
        </CardTitle>
        <CardDescription>
          Visualize métricas de alcance e desempenho dos seus posts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Últimos posts</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={loadMedia}
            disabled={!isConnected || loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
            Nenhum post encontrado ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const imageSrc = item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="h-20 w-20 overflow-hidden rounded-md border border-border/60 bg-background/40">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.caption ?? "Imagem do post"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {item.caption ?? MEDIA_PLACEHOLDER}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{item.media_type ?? "POST"}</Badge>
                        {item.timestamp ? (
                          <span>{new Date(item.timestamp).toLocaleDateString("pt-BR")}</span>
                        ) : null}
                        {item.permalink ? (
                          <a
                            href={item.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Abrir post
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => loadInsights(item.id, item.media_type)}
                      disabled={!isConnected}
                      className="w-full sm:w-auto sm:self-start"
                    >
                      Ver insights
                    </Button>
                  </div>
                  {insights[item.id]?.length ? (
                    <div className="grid gap-2 text-xs text-muted-foreground [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
                      {insights[item.id].map((metric) => (
                        <div
                          key={`${item.id}-${metric.name}`}
                          className="rounded-md border border-border/60 bg-background/70 px-3 py-2"
                        >
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground leading-snug">
                            {metric.name}
                          </p>
                          <p className="text-sm font-semibold text-foreground">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
