"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Download, ImageIcon, Sparkles, Star, Trash2 } from "lucide-react"

export type UploadItem = {
  id: string
  url: string
  prompt: string | null
  style?: string | null
  tags?: string[]
  favorite?: boolean
  collection?: { id: string; name: string } | null
  createdAt: string
}

type CollectionItem = {
  id: string
  name: string
}

interface UserUploadsGridProps {
  uploads: UploadItem[]
  onDelete?: (id: string) => void
  onUpdate?: (id: string, payload: UploadUpdatePayload) => void
  deletingId?: string | null
  collections?: CollectionItem[]
  viewMode?: "grid" | "timeline"
}

type UploadUpdatePayload = {
  favorite?: boolean
  tags?: string[]
  collectionId?: string | null
}

export function UserUploadsGrid({
  uploads,
  onDelete,
  onUpdate,
  deletingId,
  collections = [],
  viewMode = "grid",
}: UserUploadsGridProps) {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  )

  const [editingTags, setEditingTags] = useState<Record<string, string>>({})

  async function handleDownload(url: string) {
    const response = await fetch(url)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = `imagem-${Date.now()}.png`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)
  }

  if (!uploads.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground/60" />
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhuma imagem gerada ainda. Crie sua primeira personalizada.
        </p>
      </div>
    )
  }

  const wrapperClass =
    viewMode === "timeline"
      ? "space-y-3"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"

  let lastDateKey = ""

  return (
    <div className={wrapperClass}>
      {viewMode === "timeline" ? (
        <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/60 px-4 py-3 text-xs font-semibold text-foreground/80 md:grid-cols-[72px_1fr_auto]">
          <span>Imagem</span>
          <span>Detalhes</span>
          <span className="text-right">Tags</span>
        </div>
      ) : null}
      {uploads.map((upload) => {
        const createdLabel = formatter.format(new Date(upload.createdAt))
        const createdDate = new Date(upload.createdAt)
        const dateKey = createdDate.toISOString().split("T")[0] ?? ""
        const promptPreview = upload.prompt?.trim() ? upload.prompt.trim() : "Prompt não informado."
        const tagsLabel = upload.tags?.length ? upload.tags.join(", ") : ""
        const showDateHeader = viewMode === "timeline" && dateKey !== lastDateKey

        if (showDateHeader) {
          lastDateKey = dateKey
        }

        if (viewMode === "timeline") {
          return (
            <div
              key={upload.id}
              className="grid gap-3 rounded-lg border border-border/60 bg-card/95 p-3 text-sm shadow-sm md:grid-cols-[80px_1fr_auto]"
            >
              <div className="flex items-center justify-center">
                <div className="relative h-14 w-14 overflow-hidden rounded-md border border-border bg-muted/10">
                  <Image
                    src={upload.url}
                    alt="Miniatura"
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {createdLabel}
                  </Badge>
                  {upload.style ? (
                    <Badge variant="outline" className="text-xs">
                      {upload.style}
                    </Badge>
                  ) : null}
                  {upload.collection ? (
                    <Badge variant="secondary" className="text-xs">
                      {upload.collection.name}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{promptPreview}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="icon"
                    variant={upload.favorite ? "default" : "outline"}
                    onClick={() => onUpdate?.(upload.id, { favorite: !upload.favorite })}
                    aria-label="Favoritar"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  {onDelete ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="destructive"
                          disabled={deletingId === upload.id}
                          aria-label="Excluir imagem"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir imagem?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação remove a imagem do Blob e do seu histórico. Essa mudança não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(upload.id)}>
                            Excluir agora
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary">
                        Ver detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Imagem gerada
                        </DialogTitle>
                        <DialogDescription>
                          Criada em {createdLabel}. Veja a imagem e o prompt utilizado.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/10">
                          <Image
                            src={upload.url}
                            alt="Imagem gerada"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 420px"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                            {promptPreview}
                          </div>
                          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                            ID: <span className="text-foreground">{upload.id}</span>
                          </div>
                          <Button variant="secondary" className="w-full" onClick={() => handleDownload(upload.url)}>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar imagem
                          </Button>
                          {onDelete ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  disabled={deletingId === upload.id}
                                >
                                  {deletingId === upload.id ? "Excluindo..." : "Excluir imagem"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir imagem?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação remove a imagem do Blob e do seu histórico. Essa mudança
                                    não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(upload.id)}>
                                    Excluir agora
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : null}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {upload.tags?.length ? (
                      upload.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span>Nenhuma</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div key={upload.id} className={viewMode === "timeline" ? "relative pl-6" : ""}>
            {showDateHeader ? (
              <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-3 py-1">
                  {createdDate.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="h-px flex-1 bg-border/60" />
              </div>
            ) : null}

            {viewMode === "timeline" ? (
              <span className="absolute left-1 top-4 h-full w-px bg-border/60" />
            ) : null}

            <div className={`rounded-lg border border-border/60 bg-card/95 p-4 shadow-sm space-y-3 ${viewMode === "timeline" ? "md:flex md:gap-4 md:space-y-0" : ""}`}>
              <div className={`relative overflow-hidden rounded-lg border border-border bg-muted/10 ${viewMode === "timeline" ? "aspect-square md:h-36 md:w-36 md:shrink-0" : "aspect-square"}`}>
                <Image
                  src={upload.url}
                  alt="Imagem gerada"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                />
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {createdLabel}
                  </Badge>
                  {upload.style ? (
                    <Badge variant="outline" className="text-xs">
                      {upload.style}
                    </Badge>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant={upload.favorite ? "default" : "outline"}
                      onClick={() => onUpdate?.(upload.id, { favorite: !upload.favorite })}
                      aria-label="Favoritar"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    {onDelete ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            disabled={deletingId === upload.id}
                            aria-label="Excluir imagem"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir imagem?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação remove a imagem do Blob e do seu histórico. Essa mudança não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(upload.id)}>
                              Excluir agora
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Coleção</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={upload.collection?.id ?? "none"}
                    onChange={(event) =>
                      onUpdate?.(upload.id, {
                        collectionId: event.target.value === "none" ? null : event.target.value,
                      })
                    }
                  >
                    <option value="none">Sem coleção</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editingTags[upload.id] ?? tagsLabel}
                      onChange={(event) =>
                        setEditingTags((prev) => ({ ...prev, [upload.id]: event.target.value }))
                      }
                      placeholder="Ex: retrato, neon"
                    />
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onUpdate?.(upload.id, {
                          tags: (editingTags[upload.id] ?? tagsLabel)
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
                      }
                    >
                      Salvar
                    </Button>
                  </div>
                  {upload.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {upload.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary">
                      Ver detalhes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Imagem gerada
                      </DialogTitle>
                      <DialogDescription>
                        Criada em {createdLabel}. Veja a imagem e o prompt utilizado.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/10">
                        <Image
                          src={upload.url}
                          alt="Imagem gerada"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 420px"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                          {promptPreview}
                        </div>
                        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                          ID: <span className="text-foreground">{upload.id}</span>
                        </div>
                        <Button variant="secondary" className="w-full" onClick={() => handleDownload(upload.url)}>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar imagem
                        </Button>
                        {onDelete ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                className="w-full"
                                disabled={deletingId === upload.id}
                              >
                                {deletingId === upload.id ? "Excluindo..." : "Excluir imagem"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir imagem?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação remove a imagem do Blob e do seu histórico. Essa mudança
                                  não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(upload.id)}>
                                  Excluir agora
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : null}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
