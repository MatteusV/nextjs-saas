"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, ImagePlus, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

type InstagramPublishCardProps = {
  isConnected: boolean
  pageName?: string | null
}

export function InstagramPublishCard({ isConnected, pageName }: InstagramPublishCardProps) {
  const { toast } = useToast()
  const [imageUrl, setImageUrl] = useState("")
  const [uploads, setUploads] = useState<Array<{ id: string; url: string; createdAt: string }>>(
    []
  )
  const [selectedUploadId, setSelectedUploadId] = useState("")
  const [caption, setCaption] = useState("")
  const [scheduleAt, setScheduleAt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUploads, setIsLoadingUploads] = useState(false)
  const [uploadsPage, setUploadsPage] = useState(1)
  const [hasMoreUploads, setHasMoreUploads] = useState(true)

  const isScheduleValid = useMemo(() => scheduleAt.trim().length > 0, [scheduleAt])
  const selectedUpload = uploads.find((upload) => upload.id === selectedUploadId)

  useEffect(() => {
    if (!isConnected) return
    let isMounted = true
    setUploads([])
    setUploadsPage(1)
    setHasMoreUploads(true)

    return () => {
      isMounted = false
    }
  }, [isConnected, toast])

  useEffect(() => {
    if (!isConnected || !hasMoreUploads) return
    let isMounted = true

    async function loadUploads() {
      setIsLoadingUploads(true)
      try {
        const response = await fetch(
          `/api/uploads?page=${uploadsPage}&pageSize=12&sort=newest`
        )
        const data = await response.json()
        if (!response.ok) {
          throw new Error()
        }
        if (isMounted) {
          setUploads((prev) => [...prev, ...(data.items ?? [])])
          setHasMoreUploads(Boolean(data.hasMore))
        }
      } catch {
        toast({
          title: "Não foi possível carregar suas imagens",
          description: "Tente novamente em instantes.",
          variant: "destructive",
        })
      } finally {
        if (isMounted) {
          setIsLoadingUploads(false)
        }
      }
    }

    loadUploads()

    return () => {
      isMounted = false
    }
  }, [isConnected, uploadsPage, hasMoreUploads, toast])

  async function handlePublish(mode: "now" | "schedule") {
    if (!imageUrl.trim()) {
      toast({
        title: "Informe uma imagem",
        description: "Selecione uma imagem salva para publicar no Instagram.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          caption: caption.trim(),
          scheduleAt: mode === "schedule" ? scheduleAt : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ?? "Falha ao publicar")
      }

      if (data?.scheduled) {
        toast({
          title: "Post agendado",
          description: "Vamos publicar seu post no horário escolhido.",
        })
      } else {
        toast({
          title: "Publicado com sucesso",
          description: "Seu post já está no Instagram.",
        })
      }

      setCaption("")
      if (mode === "schedule") {
        setScheduleAt("")
      }
    } catch (error) {
      toast({
        title: "Não foi possível publicar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-xl border-border/50 bg-card/95">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <ImagePlus className="h-5 w-5 text-primary" />
          Publicar no Instagram
        </CardTitle>
        <CardDescription>
          Use uma URL pública da imagem. Suporta publicação imediata ou agendada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Conta conectada</span>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? pageName ?? "Instagram" : "Desconectado"}
          </Badge>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Imagem para publicar</label>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isLoadingUploads && uploads.length === 0
                ? "Carregando imagens..."
                : `${uploads.length} imagens carregadas`}
            </span>
            {selectedUpload ? <span>Selecionada: {selectedUploadId.slice(0, 6)}...</span> : null}
          </div>
          {uploads.length === 0 && !isLoadingUploads ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Nenhuma imagem salva encontrada.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                {uploads.map((upload) => {
                  const isSelected = selectedUploadId === upload.id
                  return (
                    <button
                      key={upload.id}
                      type="button"
                      onClick={() => {
                        setSelectedUploadId(upload.id)
                        setImageUrl(upload.url)
                      }}
                      disabled={!isConnected || isLoading || isLoadingUploads}
                      className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 hover:border-primary/50 hover:bg-muted/40"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <img
                        src={upload.url}
                        alt="Imagem salva"
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-[11px] text-foreground">
                        {new Date(upload.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </button>
                  )
                })}
              </div>
              {hasMoreUploads ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setUploadsPage((prev) => prev + 1)}
                  disabled={isLoadingUploads}
                >
                  {isLoadingUploads ? "Carregando..." : "Carregar mais imagens"}
                </Button>
              ) : null}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Apenas imagens salvas no seu storage podem ser publicadas.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Legenda</label>
          <Textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Descreva o post e inclua hashtags se desejar."
            rows={4}
            disabled={!isConnected || isLoading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Agendar (opcional)</label>
          <Input
            type="datetime-local"
            value={scheduleAt}
            onChange={(event) => setScheduleAt(event.target.value)}
            disabled={!isConnected || isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Se preencher, o post será publicado automaticamente no horário definido.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/60">
        <Button
          className="w-full"
          onClick={() => handlePublish("now")}
          disabled={!isConnected || isLoading}
        >
          <Send className="mr-2 h-4 w-4" />
          Publicar agora
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => handlePublish("schedule")}
          disabled={!isConnected || isLoading || !isScheduleValid}
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          Agendar publicação
        </Button>
      </CardFooter>
    </Card>
  )
}
