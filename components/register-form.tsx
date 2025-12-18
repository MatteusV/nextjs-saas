"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff, XCircle, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"

interface FormErrors {
  name?: string
  email?: string
  password?: string
  general?: string
}

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })

  function validateField(field: keyof typeof formData, value: string): string | undefined {
    switch (field) {
      case "name":
        if (value.length < 3) return "Nome deve ter no mínimo 3 caracteres"
        break
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return "Email inválido"
        break
      case "password":
        if (value.length < 8) return "Senha deve ter no mínimo 8 caracteres"
        break
    }
    return undefined
  }

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleBlur(field: keyof typeof formData) {
    const error = validateField(field, formData[field])
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  function getPasswordStrength(password: string) {
    if (password.length === 0) return { strength: 0, label: "", color: "" }
    if (password.length < 8) return { strength: 1, label: "Fraca", color: "text-destructive" }

    let strength = 1
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 2) return { strength: 2, label: "Média", color: "text-chart-3" }
    if (strength <= 3) return { strength: 3, label: "Boa", color: "text-chart-1" }
    return { strength: 4, label: "Forte", color: "text-chart-1" }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: FormErrors = {}
    Object.keys(formData).forEach((field) => {
      const error = validateField(field as keyof typeof formData, formData[field as keyof typeof formData])
      if (error) newErrors[field as keyof FormErrors] = error
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await api("/users/register", {
        method: "POST",
        body: JSON.stringify(formData),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 400) {
          if (data.error === "User already exists") {
            setErrors({ email: "Este email já está cadastrado" })
            toast({
              title: "Email já cadastrado",
              description: "Tente fazer login ou use outro email",
              variant: "destructive",
            })
          } else {
            setErrors({ general: data.error || "Erro ao criar conta" })
            toast({
              title: "Erro no cadastro",
              description: data.error || "Não foi possível criar sua conta",
              variant: "destructive",
            })
          }
        } else {
          throw new Error(data.error || "Erro ao criar conta")
        }
        return
      }

      toast({
        title: "Conta criada com sucesso!",
        description: data.verificationSent ? "Verifique seu email para ativar sua conta" : "Redirecionando...",
      })

      setTimeout(() => {
        router.push(data.verificationSent ? "/verify-email" : "/app")
      }, 1500)
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
      setErrors({ general: "Erro ao conectar com o servidor" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
      <CardHeader>
        <CardTitle>Cadastro</CardTitle>
        <CardDescription>Preencha os dados abaixo para criar sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="João Silva"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              disabled={isLoading}
              className={errors.name ? "border-destructive" : ""}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              disabled={isLoading}
              className={errors.email ? "border-destructive" : ""}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
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
                onBlur={() => handleBlur("password")}
                disabled={isLoading}
                className={errors.password ? "border-destructive pr-10" : "pr-10"}
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

            {formData.password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.strength
                          ? passwordStrength.strength <= 2
                            ? "bg-destructive"
                            : passwordStrength.strength === 3
                              ? "bg-chart-3"
                              : "bg-chart-1"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength.color}`}>Senha {passwordStrength.label}</p>
              </div>
            )}

            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <p className="text-sm text-muted-foreground text-center">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Fazer login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
