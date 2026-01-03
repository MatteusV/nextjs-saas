"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"

type BuyCreditsButtonProps = React.ComponentProps<typeof Button> & {
  label?: string
}

export function BuyCreditsButton({
  label = "Comprar créditos",
  ...props
}: BuyCreditsButtonProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    try {
      const response = await api("/stripe/credits", { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível iniciar o checkout")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: "Erro no checkout",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? "Redirecionando..." : label}
    </Button>
  )
}
