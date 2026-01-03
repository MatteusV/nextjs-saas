"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface StripePortalButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "children" | "onClick"> {
  children: React.ReactNode
  leadingIcon?: React.ReactNode
  returnUrl?: string
}

export function StripePortalButton({
  children,
  leadingIcon,
  returnUrl,
  disabled,
  ...props
}: StripePortalButtonProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    if (disabled || isLoading) {
      return
    }

    setIsLoading(true)
    try {
      const response = await api("/stripe/portal", {
        method: "POST",
        body: JSON.stringify({ returnUrl }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Não foi possível abrir o portal do Stripe")
      }

      const data = await response.json()
      if (!data?.url) {
        throw new Error("Portal do Stripe indisponivel")
      }

      window.location.href = data.url
    } catch (error) {
      toast({
        title: "Erro ao abrir Stripe",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={disabled || isLoading} {...props}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : leadingIcon}
      {children}
    </Button>
  )
}
