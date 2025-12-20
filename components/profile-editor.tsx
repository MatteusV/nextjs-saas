"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader2, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfileEditorProps {
  name: string
  email: string
  pendingEmail?: string | null
}

export function ProfileEditor({ name, email, pendingEmail }: ProfileEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({ name, email })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (formData.name.trim().length < 3) {
      setError("Nome deve ter no minimo 3 caracteres")
      return
    }

    setIsSaving(true)
    try {
      const response = await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel atualizar o perfil")
      }

      if (data.emailChangeSent) {
        toast({
          title: "Confirme seu novo email",
          description: "Enviamos um link para validar o novo endereco.",
        })
      } else {
        toast({
          title: "Perfil atualizado",
          description: "As informacoes foram salvas com sucesso",
        })
      }
      router.refresh()
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Nao foi possivel atualizar o perfil"
      setError(message)
      toast({
        title: "Erro ao salvar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <User className="h-5 w-5 text-primary" />
          Editar perfil
        </CardTitle>
        <CardDescription>Atualize seu nome e solicite a troca de email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" id="profile-editor-form">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={formData.name}
              onChange={(event) => handleChange("name", event.target.value)}
              disabled={isSaving}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={formData.email}
              onChange={(event) => handleChange("email", event.target.value)}
              disabled={isSaving}
            />
          </div>
          {pendingEmail ? (
            <p className="text-sm text-muted-foreground">
              Aguardando confirmacao: <span className="text-foreground">{pendingEmail}</span>
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </form>
      </CardContent>
      <CardFooter className="border-t border-border/60">
        <Button type="submit" form="profile-editor-form" className="w-full" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar alteracoes
        </Button>
      </CardFooter>
    </Card>
  )
}
