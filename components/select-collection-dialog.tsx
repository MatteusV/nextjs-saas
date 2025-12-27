"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export type CollectionOption = {
  id: string
  name: string
}

interface SelectCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collections: CollectionOption[]
  selectedId: string
  onSelect: (value: string) => void
  onSave: () => void
  isSaving?: boolean
}

export function SelectCollectionDialog({
  open,
  onOpenChange,
  collections,
  selectedId,
  onSelect,
  onSave,
  isSaving = false,
}: SelectCollectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-lg lg:max-w-[50vw] border-border/60 bg-card/95 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Salvar imagem</DialogTitle>
          <DialogDescription>
            Escolha uma coleção para organizar sua imagem. Você também pode salvar sem coleção.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collection-select">Coleção</Label>
            <select
              id="collection-select"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedId}
              onChange={(event) => onSelect(event.target.value)}
            >
              <option value="">Sem coleção (salvar solta)</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {collections.slice(0, 4).map((collection) => (
                <Badge
                  key={collection.id}
                  variant={selectedId === collection.id ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => onSelect(collection.id)}
                >
                  {collection.name}
                </Badge>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando
              </>
            ) : (
              "Salvar imagem"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
