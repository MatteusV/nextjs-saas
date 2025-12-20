"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader2, Mail } from "lucide-react"

export function PasswordResetCard() {
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)

  async function handleSend() {
    setIsSending(true)
    try {
      const response = await api("/users/password-reset/request", { method: "POST" })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel enviar o link")
      }

      toast({
        title: "Link enviado",
        description: "Confira seu email para redefinir a senha.",
      })
    } catch (error) {
      toast({
        title: "Erro ao enviar link",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Mail className="h-5 w-5 text-primary" />
          Redefinir senha
        </CardTitle>
        <CardDescription>Receba um link seguro para criar uma nova senha.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Enviaremos um link para o seu email cadastrado com validade de 1 hora.
      </CardContent>
      <CardFooter className="border-t border-border/60">
        <Button className="w-full" onClick={handleSend} disabled={isSending}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar link de redefinicao
        </Button>
      </CardFooter>
    </Card>
  )
}
