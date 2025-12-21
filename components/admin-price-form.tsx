"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

type AdminPlan = {
  id: string
  name: string
  priceLabel: string | null
}

interface AdminPriceFormProps {
  plans: AdminPlan[]
}

export function AdminPriceForm({ plans }: AdminPriceFormProps) {
  const { toast } = useToast()
  const [planId, setPlanId] = useState(plans[0]?.id ?? "PRO")
  const [amount, setAmount] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit() {
    if (!amount.trim()) {
      toast({
        title: "Informe um valor",
        description: "Digite o novo preço do plano.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await api("/admin/price", {
        method: "POST",
        body: JSON.stringify({ planId, amount }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível atualizar o preço")
      }

      toast({
        title: "Preço atualizado",
        description: "Um novo priceId foi criado no Stripe.",
      })
      setAmount("")
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
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
        <Label htmlFor="admin-plan">Plano</Label>
        <select
          id="admin-plan"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={planId}
          onChange={(event) => setPlanId(event.target.value)}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} {plan.priceLabel ? `(${plan.priceLabel})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-price">Novo preço mensal</Label>
        <Input
          id="admin-price"
          placeholder="Ex: 49,80"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>
      <div className="md:col-span-2">
        <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  )
}
