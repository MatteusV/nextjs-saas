"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"

type AdminPlan = {
  id: string
  name: string
  benefits: string[] | null
}

interface AdminPlanBenefitsFormProps {
  plans: AdminPlan[]
}

function benefitsToText(benefits: string[] | null | undefined) {
  return benefits?.join("\n") ?? ""
}

export function AdminPlanBenefitsForm({ plans }: AdminPlanBenefitsFormProps) {
  const { toast } = useToast()
  const [planId, setPlanId] = useState(plans[0]?.id ?? "PRO")
  const [benefitsText, setBenefitsText] = useState(benefitsToText(plans[0]?.benefits))
  const [isSaving, setIsSaving] = useState(false)

  const benefitsByPlan = useMemo(
    () => Object.fromEntries(plans.map((plan) => [plan.id, plan.benefits ?? []])),
    [plans]
  )

  useEffect(() => {
    setBenefitsText(benefitsToText(benefitsByPlan[planId]))
  }, [planId, benefitsByPlan])

  async function handleSubmit() {
    const benefits = benefitsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)

    if (!benefits.length) {
      toast({
        title: "Informe os benefícios",
        description: "Adicione pelo menos um benefício para o plano.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await api("/admin/plan-benefits", {
        method: "POST",
        body: JSON.stringify({ planId, benefits }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível atualizar os benefícios")
      }

      toast({
        title: "Benefícios atualizados",
        description: "As alterações já aparecem nas páginas públicas.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="benefits-plan">Plano</Label>
        <select
          id="benefits-plan"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={planId}
          onChange={(event) => setPlanId(event.target.value)}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="benefits-list">Benefícios (um por linha)</Label>
        <Textarea
          id="benefits-list"
          rows={6}
          value={benefitsText}
          onChange={(event) => setBenefitsText(event.target.value)}
          placeholder="Ex: 50 imagens/mês"
        />
      </div>
      <div className="md:col-span-2">
        <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar benefícios"}
        </Button>
      </div>
    </div>
  )
}
