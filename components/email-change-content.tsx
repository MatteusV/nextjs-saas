"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { api } from "@/utils/api"
import { Loader2, MailCheck } from "lucide-react"

type Status = "loading" | "success" | "error"

export function EmailChangeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<Status>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function confirmChange() {
      if (!token) {
        setStatus("error")
        setMessage("Token inválido.")
        return
      }

      try {
        const response = await api(`/users/email-change?token=${encodeURIComponent(token)}`)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível confirmar a troca.")
        }

        setStatus("success")
        setMessage("Email atualizado com sucesso.")
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Não foi possível confirmar a troca.")
      }
    }

    confirmChange()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-medium">
            <MailCheck className="h-5 w-5 text-primary" />
            Confirmação de email
          </CardTitle>
          <CardDescription>Finalize a troca do seu endereço de email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {status === "loading" ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validando seu link...
            </div>
          ) : (
            <p className={status === "error" ? "text-destructive" : "text-foreground"}>
              {message}
            </p>
          )}
        </CardContent>
        <CardFooter className="border-t border-border/60">
          <Button asChild className="w-full">
            <Link href="/app/profile">Voltar para perfil</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
