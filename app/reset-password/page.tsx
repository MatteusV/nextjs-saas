"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { Loader2, Lock } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!token) {
      setError("Token invalido.")
      return
    }

    if (password.length < 8) {
      setError("Senha deve ter no minimo 8 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const response = await api("/users/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível redefinir a senha.")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/reset-password/success")
      }, 1500)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao redefinir senha.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-medium">
            <Lock className="h-5 w-5 text-primary" />
            Redefinir senha
          </CardTitle>
          <CardDescription>Crie uma nova senha para acessar sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" id="reset-password-form">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSaving || success}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isSaving || success}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? (
              <p className="text-sm text-chart-1">Senha atualizada. Redirecionando...</p>
            ) : null}
          </form>
        </CardContent>
        <CardFooter className="border-t border-border/60">
          <Button className="w-full" type="submit" form="reset-password-form" disabled={isSaving || success}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Atualizar senha
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
