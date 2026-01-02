"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function ClearIntegrationLogsButton() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClear() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/logs/clear", { method: "POST" })
      if (!response.ok) {
        throw new Error()
      }

      toast({
        title: "Logs limpos",
        description: "O histórico de eventos foi removido.",
      })
      router.refresh()
    } catch {
      toast({
        title: "Não foi possível limpar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClear}
      disabled={isLoading}
      aria-label="Limpar logs"
      className="text-muted-foreground hover:text-foreground"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
