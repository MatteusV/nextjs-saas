"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export function AdminNotificationForm() {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState("all")
  const [isSending, setIsSending] = useState(false)

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Preencha os campos",
        description: "Titulo e mensagem sao obrigatorios.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await api("/admin/notifications", {
        method: "POST",
        body: JSON.stringify({ title, body, audience }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível enviar a notificação")
      }

      toast({
        title: "Notificação enviada",
        description: "O comunicado foi salvo com sucesso.",
      })
      setTitle("")
      setBody("")
      setAudience("all")
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="notify-title">Titulo</Label>
        <Input
          id="notify-title"
          placeholder="Nova atualização no app"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notify-body">Mensagem</Label>
        <Textarea
          id="notify-body"
          placeholder="Escreva o comunicado para os usuários..."
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notify-audience">Público</Label>
        <select
          id="notify-audience"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
        >
          <option value="all">Todos os usuários</option>
          <option value="pro">Apenas Pro</option>
          <option value="business">Apenas Business</option>
          <option value="free">Apenas Free</option>
        </select>
      </div>
      <Button className="w-full" onClick={handleSend} disabled={isSending}>
        {isSending ? "Enviando..." : "Enviar notificação"}
      </Button>
    </div>
  )
}
