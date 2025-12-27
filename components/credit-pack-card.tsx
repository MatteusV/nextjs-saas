"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BuyCreditsButton } from "@/components/buy-credits-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type CreditPackCardProps = {
  packAmount: number | null
  priceLabel: string | null
  stripeEnabled: boolean
  canBuy: boolean
  upgradeUrl?: string
}

export function CreditPackCard({
  packAmount,
  priceLabel,
  stripeEnabled,
  canBuy,
  upgradeUrl = "/app/plans",
}: CreditPackCardProps) {
  const isAvailable = Boolean(packAmount && priceLabel)

  return (
    <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl font-medium text-balance">Créditos adicionais</CardTitle>
            <CardDescription>
              Compre pacotes avulsos para continuar gerando sem trocar de plano.
            </CardDescription>
          </div>
          <Badge variant="secondary">Avulso</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-1">
          <p className="text-sm font-medium">
            {packAmount ? `${packAmount} créditos por pacote` : "Pacotes indisponíveis"}
          </p>
          <p className="text-sm text-muted-foreground">
            {priceLabel ?? "Defina o preço no Stripe para habilitar a compra."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <BuyCreditsButton
            className="w-full"
            disabled={!stripeEnabled || !canBuy || !isAvailable}
            label="Comprar créditos extras"
          />
          {!stripeEnabled ? (
            <p className="text-xs text-muted-foreground">
              Stripe não configurado. Defina `STRIPE_SECRET_KEY` para ativar.
            </p>
          ) : null}
          {!isAvailable ? (
            <Button variant="ghost" className="w-full" asChild>
              <Link href={upgradeUrl}>Ver planos disponíveis</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
