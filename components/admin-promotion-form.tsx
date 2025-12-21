"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export function AdminPromotionForm() {
  const { toast } = useToast()
  const [code, setCode] = useState("")
  const [discount, setDiscount] = useState("")
  const [limit, setLimit] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function handleCreate() {
    if (!code.trim() || !discount.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Informe o codigo e o desconto.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await api("/admin/promotions", {
        method: "POST",
        body: JSON.stringify({
          code,
          discount,
          limit,
          expiresAt,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível criar a promoção")
      }

      toast({
        title: "Promoção criada",
        description: "Cupom salvo com sucesso.",
      })
      setCode("")
      setDiscount("")
      setLimit("")
      setExpiresAt("")
    } catch (error) {
      toast({
        title: "Erro ao criar",
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
        <Label htmlFor="coupon-code">Codigo</Label>
        <Input
          id="coupon-code"
          placeholder="BLACKFRIDAY50"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-discount">Desconto (%)</Label>
        <Input
          id="coupon-discount"
          placeholder="50"
          value={discount}
          onChange={(event) => setDiscount(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-limit">Limite de uso</Label>
        <Input
          id="coupon-limit"
          placeholder="200"
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-expire">Validade (YYYY-MM-DD)</Label>
        <Input
          id="coupon-expire"
          placeholder="2026-01-31"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
      </div>
      <div className="md:col-span-2">
        <Button className="w-full" onClick={handleCreate} disabled={isSaving}>
        {isSaving ? "Salvando..." : "Criar promoção"}
        </Button>
      </div>
    </div>
  )
}
