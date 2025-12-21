"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, Sparkles } from "lucide-react"

type Plan = {
  id: string
  name: string
  description?: string | null
  stylizeLimit?: number | null
  stripePriceId?: string | null
  priceLabel?: string | null
  benefits?: string[] | null
}

interface PlanSelectorProps {
  plans: Plan[]
  currentPlanId: string
}

export function PlanSelector({ plans, currentPlanId }: PlanSelectorProps) {
  const { toast } = useToast()
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  async function handleCheckout(plan: Plan) {
    if (!plan.stripePriceId) {
      toast({
        title: "Plano indisponivel",
        description: "Este plano não possui cobrança configurada.",
        variant: "destructive",
      })
      return
    }

    setLoadingPlanId(plan.id)
    try {
      const response = await api("/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId: plan.stripePriceId }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível iniciar o checkout")
      }

      if (!data?.url) {
        throw new Error("Checkout indisponivel")
      }

      window.location.href = data.url
    } catch (error) {
      toast({
        title: "Erro ao iniciar checkout",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId
        const isLoading = loadingPlanId === plan.id
        const isFree = !plan.stripePriceId

        return (
          <Card
            key={plan.id}
            className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95 flex flex-col"
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xl font-medium">{plan.name}</CardTitle>
                {isCurrent ? <Badge variant="secondary">Atual</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description ?? "Plano personalizado."}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.priceLabel ? (
                <p className="text-2xl font-semibold">{plan.priceLabel}</p>
              ) : (
                <p className="text-2xl font-semibold">Consulte valores</p>
              )}
              {plan.benefits?.length ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {!plan.benefits?.length ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  {plan.stylizeLimit
                    ? `${plan.stylizeLimit} gerações por período`
                    : "Gerações ilimitadas"}
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Atualize o pagamento no checkout do Stripe.
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/60 mt-auto">
              <Button
                className="w-full"
                variant={isCurrent ? "secondary" : "default"}
                disabled={isCurrent || isLoading || isFree}
                onClick={() => handleCheckout(plan)}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isCurrent ? "Plano atual" : isFree ? "Plano gratuito" : "Selecionar plano"}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
