"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserUploadsGrid, type UploadItem } from "@/components/user-uploads-grid"
import { api } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import { LayoutGrid, List } from "lucide-react"

type SortOption = "newest" | "oldest"
type RangeOption = "all" | "7d" | "30d" | "90d"
type ViewMode = "grid" | "timeline"

type CollectionItem = {
  id: string
  name: string
}

export interface UploadsPanelProps {
  initialUploads: UploadItem[]
  initialHasMore: boolean
  initialTotal: number
  pageSize: number
  styles: string[]
  initialCollections: CollectionItem[]
}

export function UploadsPanel({
  initialUploads,
  initialHasMore,
  initialTotal,
  pageSize,
  styles,
  initialCollections,
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
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections)
  const [collectionFilter, setCollectionFilter] = useState("all")
  const [tagsFilter, setTagsFilter] = useState("")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [newCollectionName, setNewCollectionName] = useState("")
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const { toast } = useToast()

  const styleOptions = useMemo(() => ["all", ...styles], [styles])
  const collectionOptions = useMemo(
    () => [{ id: "all", name: "Todas" }, ...collections],
    [collections]
  )

  useEffect(() => {
    let isMounted = true

    async function fetchCollections() {
      try {
        const response = await api("/collections")
        if (!response.ok) return
        const data = await response.json()
        if (isMounted) {
          setCollections(data.collections ?? [])
        }
      } catch (error) {
        console.error("[collections] Failed to load collections:", error)
      }
    }

    fetchCollections()

    return () => {
      isMounted = false
    }
  }, [])

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
      if (collectionFilter !== "all") {
        params.set("collection", collectionFilter)
      }
      if (tagsFilter.trim()) {
        params.set("tags", tagsFilter.trim())
      }
      if (favoriteFilter === "true") {
        params.set("favorite", "true")
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

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return
    setIsCreatingCollection(true)

    try {
      const response = await api("/collections", {
        method: "POST",
        body: JSON.stringify({ name: newCollectionName.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível criar a coleção")
      }
      setCollections((prev) => [data.collection, ...prev])
      setNewCollectionName("")
      toast({
        title: "Coleção criada",
        description: "Sua nova coleção já está disponível.",
      })
    } catch (error) {
      toast({
        title: "Erro ao criar coleção",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCollection(false)
    }
  }

  async function handleUpdateUpload(
    id: string,
    payload: { favorite?: boolean; tags?: string[]; collectionId?: string | null }
  ) {
    const previous = uploads
    setUploads((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              favorite: payload.favorite ?? item.favorite,
              tags: payload.tags ?? item.tags,
              collection: payload.collectionId
                ? collections.find((collection) => collection.id === payload.collectionId) ?? item.collection
                : payload.collectionId === null
                ? null
                : item.collection,
            }
          : item
      )
    )

    try {
      const response = await api(`/uploads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível atualizar a imagem")
      }
      setUploads((prev) => prev.map((item) => (item.id === id ? data.item : item)))
      toast({
        title: "Atualização salva",
        description: "Os dados da imagem foram atualizados.",
      })
    } catch (error) {
      setUploads(previous)
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    }
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
        <div className="space-y-2">
          <Label htmlFor="uploads-collection">Coleção</Label>
          <select
            id="uploads-collection"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={collectionFilter}
            onChange={(event) => setCollectionFilter(event.target.value)}
          >
            {collectionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="uploads-tags">Tags</Label>
          <Input
            id="uploads-tags"
            placeholder="Ex: retrato, neon"
            value={tagsFilter}
            onChange={(event) => setTagsFilter(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uploads-favorites">Favoritos</Label>
          <select
            id="uploads-favorites"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={favoriteFilter}
            onChange={(event) => setFavoriteFilter(event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="true">Apenas favoritos</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{total} imagens encontradas</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Grade
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            <List className="mr-2 h-4 w-4" />
            Linha do tempo
          </Button>
          <Button variant="secondary" onClick={handleApplyFilters} disabled={isLoading}>
            Aplicar filtros
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Coleções</p>
            <p className="text-xs text-muted-foreground">
              Agrupe suas imagens por projeto ou cliente.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Nova coleção"
              value={newCollectionName}
              onChange={(event) => setNewCollectionName(event.target.value)}
            />
            <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim() || isCreatingCollection}>
              {isCreatingCollection ? "Criando..." : "Criar coleção"}
            </Button>
          </div>
        </div>
      </div>

      <UserUploadsGrid
        uploads={uploads}
        onDelete={handleDelete}
        onUpdate={handleUpdateUpload}
        deletingId={deletingId}
        collections={collections}
        viewMode={viewMode}
      />

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
