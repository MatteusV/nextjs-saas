"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type PromotionItem = {
  id: string
  code: string
  discountPercent: number
  maxRedemptions: number | null
  expiresAt: string | null
}

interface AdminPromotionHistoryDialogProps {
  promotions: PromotionItem[]
}

export function AdminPromotionHistoryDialog({ promotions }: AdminPromotionHistoryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          Ver promoções
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Promoções recentes</DialogTitle>
        <DialogDescription>Últimos cupons criados no Stripe.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {promotions.length ? (
            promotions.map((promo) => (
              <div
                key={promo.id}
                className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{promo.code}</p>
                  <Badge variant="secondary">{promo.discountPercent}%</Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Limite: {promo.maxRedemptions ?? "sem limite"}</span>
                  <span>
                    Expira:{" "}
                    {promo.expiresAt
                      ? new Date(promo.expiresAt).toLocaleDateString("pt-BR")
                      : "sem data"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma promoção criada ainda.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
