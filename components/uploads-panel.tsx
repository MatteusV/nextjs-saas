"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserUploadsGrid, type UploadItem } from "@/components/user-uploads-grid"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type SortOption = "newest" | "oldest"
type RangeOption = "all" | "7d" | "30d" | "90d"

export interface UploadsPanelProps {
  initialUploads: UploadItem[]
  initialHasMore: boolean
  initialTotal: number
  pageSize: number
  styles: string[]
}

export function UploadsPanel({
  initialUploads,
  initialHasMore,
  initialTotal,
  pageSize,
  styles,
}: UploadsPanelProps) {
  const [uploads, setUploads] = useState<UploadItem[]>(initialUploads)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>("newest")
  const [range, setRange] = useState<RangeOption>("all")
  const [style, setStyle] = useState("all")
  const [query, setQuery] = useState("")
  const { toast } = useToast()

  const styleOptions = useMemo(() => ["all", ...styles], [styles])

  async function fetchUploads(nextPage: number, replace = false) {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize),
        sort,
        range,
      })
      if (style !== "all") {
        params.set("style", style)
      }
      if (query.trim()) {
        params.set("q", query.trim())
      }

      const response = await api(`/uploads?${params.toString()}`)
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar as imagens")
      }

      setUploads((prev) => (replace ? data.items : [...prev, ...data.items]))
      setPage(data.page)
      setHasMore(Boolean(data.hasMore))
      setTotal(Number(data.total ?? data.items?.length ?? 0))
    } catch (error) {
      console.error("[uploads] Error fetching uploads:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleApplyFilters() {
    setPage(1)
    fetchUploads(1, true)
  }

  async function handleDelete(id: string) {
    if (deletingId) return
    setDeletingId(id)
    try {
      const response = await api(`/uploads/${id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível excluir a imagem")
      }

      setUploads((prev) => prev.filter((item) => item.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      toast({
        title: "Imagem excluida",
        description: "O arquivo foi removido com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="uploads-query">Buscar prompt</Label>
          <Input
            id="uploads-query"
            placeholder="Ex: fundo neon"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uploads-style">Estilo</Label>
          <select
            id="uploads-style"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={style}
            onChange={(event) => setStyle(event.target.value)}
          >
            {styleOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "Todos" : option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="uploads-range">Período</Label>
          <select
            id="uploads-range"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={range}
            onChange={(event) => setRange(event.target.value as RangeOption)}
          >
            <option value="all">Tudo</option>
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
            <option value="90d">Ultimos 90 dias</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="uploads-sort">Ordenação</Label>
          <select
            id="uploads-sort"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{total} imagens encontradas</p>
        <Button variant="secondary" onClick={handleApplyFilters} disabled={isLoading}>
          Aplicar filtros
        </Button>
      </div>

      <UserUploadsGrid uploads={uploads} onDelete={handleDelete} deletingId={deletingId} />

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => fetchUploads(page + 1)}
            disabled={isLoading}
          >
            {isLoading ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
