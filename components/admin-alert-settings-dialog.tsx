"use client"

import { useEffect, useState } from "react"
import { Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type AlertSettings = {
  id: string
  highUsage24hLimit: number
  premiumModel30dLimit: number
  creditOrders30dLimit: number
  creditRevenue30dLimit: number | null
  lastAlertSignature?: string | null
  lastAlertSentAt?: string | null
}

export function AdminAlertSettingsDialog() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<AlertSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    async function loadSettings() {
      setIsLoading(true)
      try {
        const response = await api("/admin/alerts")
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || "Não foi possível carregar os alertas")
        }
        if (active) {
          setSettings(data.settings)
        }
      } catch (error) {
        toast({
          title: "Erro ao carregar alertas",
          description: error instanceof Error ? error.message : "Tente novamente",
          variant: "destructive",
        })
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadSettings()
    return () => {
      active = false
    }
  }, [open, toast])

  function updateField<K extends keyof AlertSettings>(key: K, value: AlertSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSave() {
    if (!settings) return
    setIsSaving(true)
    try {
      const payload = {
        highUsage24hLimit: settings.highUsage24hLimit,
        premiumModel30dLimit: settings.premiumModel30dLimit,
        creditOrders30dLimit: settings.creditOrders30dLimit,
        creditRevenue30dLimit: settings.creditRevenue30dLimit,
      }
      const response = await api("/admin/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível salvar")
      }
      setSettings(data.settings)
      toast({
        title: "Alertas atualizados",
        description: "As regras foram salvas com sucesso.",
      })
      setOpen(false)
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
    <>
      <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
        <Settings className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configurar alertas operacionais</DialogTitle>
          </DialogHeader>
          {isLoading || !settings ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                Defina limites realistas para disparar alertas. Use valores conservadores para
                evitar surpresas de custo.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="alert-usage-24h">Gerações nas últimas 24h</Label>
                  <Input
                    id="alert-usage-24h"
                    type="number"
                    min={10}
                    value={settings.highUsage24hLimit}
                    onChange={(event) => updateField("highUsage24hLimit", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-premium-model">Uso do modelo premium (30d)</Label>
                  <Input
                    id="alert-premium-model"
                    type="number"
                    min={0}
                    value={settings.premiumModel30dLimit}
                    onChange={(event) => updateField("premiumModel30dLimit", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-credit-orders">Compras de créditos (30d)</Label>
                  <Input
                    id="alert-credit-orders"
                    type="number"
                    min={0}
                    value={settings.creditOrders30dLimit}
                    onChange={(event) => updateField("creditOrders30dLimit", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-credit-revenue">Receita de créditos (centavos)</Label>
                  <Input
                    id="alert-credit-revenue"
                    type="number"
                    min={0}
                    value={settings.creditRevenue30dLimit ?? ""}
                    onChange={(event) => {
                      const value = event.target.value
                      updateField("creditRevenue30dLimit", value ? Number(value) : null)
                    }}
                    placeholder="Ex: 50000"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar configurações"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
