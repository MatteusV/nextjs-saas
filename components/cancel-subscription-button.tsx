"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function CancelSubscriptionButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleCancel() {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await api("/stripe/cancel-subscription", { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível cancelar a renovação")
      }

      toast({
        title: "Renovação cancelada",
        description: "Sua assinatura permanece ativa até o fim do período atual.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleCancel} disabled={isLoading} className="w-full">
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Cancelar renovação
    </Button>
  )
}
