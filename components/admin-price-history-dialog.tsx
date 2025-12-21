"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type PlanItem = {
  id: string
  name: string
  priceLabel: string | null
  stripePriceId: string | null
}

interface AdminPriceHistoryDialogProps {
  plans: PlanItem[]
}

export function AdminPriceHistoryDialog({ plans }: AdminPriceHistoryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          Ver histórico de preços
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preços atuais por plano</DialogTitle>
          <DialogDescription>
            Este painel mostra o priceId e o valor ativo no Stripe. Histórico completo ainda não
            esta habilitado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.stripePriceId ?? "Sem priceId configurado"}
                </p>
              </div>
              <Badge variant="secondary">{plan.priceLabel ?? "Sem preço"}</Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
