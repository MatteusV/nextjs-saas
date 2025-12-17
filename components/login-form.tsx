"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string>("")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("API URL não configurada")
      }

      const response = await fetch(`${apiUrl}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Email ou senha incorretos")
        toast({
          title: "Erro ao fazer login",
          description: data.error || "Verifique suas credenciais",
          variant: "destructive",
        })
        return
      }

      // Save auth token to cookie
      if (data.token) {
        document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
      }

      toast({
        title: "Login realizado!",
        description: "Redirecionando...",
      })

      // Redirect to app or original destination
      const redirect = searchParams.get("redirect") || "/app"
      setTimeout(() => {
        router.push(redirect)
      }, 1000)
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
      setError("Erro ao conectar com o servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Entre com suas credenciais para acessar sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={isLoading}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <p className="text-sm text-muted-foreground text-center">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Criar conta
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
