"use client"

import { useMemo } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Calendar, ImageIcon, Sparkles } from "lucide-react"

export type UploadItem = {
  id: string
  url: string
  prompt: string | null
  style?: string | null
  createdAt: string
}

interface UserUploadsGridProps {
  uploads: UploadItem[]
  onDelete?: (id: string) => void
  deletingId?: string | null
}

export function UserUploadsGrid({ uploads, onDelete, deletingId }: UserUploadsGridProps) {
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {uploads.map((upload) => {
        const createdLabel = formatter.format(new Date(upload.createdAt))
        const promptPreview = upload.prompt?.trim() ? upload.prompt.trim() : "Prompt não informado."

        return (
          <div
            key={upload.id}
            className="rounded-lg border border-border/60 bg-card/95 p-4 shadow-sm space-y-3"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/10">
              <Image src={upload.url} alt="Imagem gerada" fill className="object-cover" />
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {createdLabel}
              </Badge>
              {upload.style ? (
                <Badge variant="outline" className="text-xs">
                  {upload.style}
                </Badge>
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
                      <Image src={upload.url} alt="Imagem gerada" fill className="object-cover" />
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                        {promptPreview}
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                        ID: <span className="text-foreground">{upload.id}</span>
                      </div>
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
        )
      })}
    </div>
  )
}
