import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Mail, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Verificação de Email",
  description: "Verifique seu email para ativar sua conta",
}

type VerifyResult =
  | { status: "success" }
  | { status: "error"; message: string }

async function verifyEmail(token: string, email: string): Promise<VerifyResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return { status: "error", message: "API não configurada (NEXT_PUBLIC_API_URL)" }
  }

  const params = new URLSearchParams({ token, email })
  const response = await fetch(`${apiUrl}/users/verify?${params.toString()}`, { cache: "no-store" })
  const data = (await response.json().catch(() => ({}))) as { verified?: boolean; error?: string }

  if (response.ok && data.verified) {
    return { status: "success" }
  }

  return { status: "error", message: data.error || "Não foi possível verificar seu email" }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground bg-gradient-to-br from-background via-accent/20 to-primary/10 dark:via-accent/10 dark:to-primary/15 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>O link de verificação está incompleto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" variant="outline">
              <Link href="/register">Voltar para o cadastro</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/login">Ir para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const result = await verifyEmail(token, email)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground bg-gradient-to-br from-background via-accent/20 to-primary/10 dark:via-accent/10 dark:to-primary/15 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              result.status === "success" ? "bg-primary/10" : "bg-destructive/10"
            }`}
          >
            {result.status === "success" ? (
              <CheckCircle2 className="w-8 h-8 text-primary" />
            ) : (
              <Mail className="w-8 h-8 text-destructive" />
            )}
          </div>
          <CardTitle>{result.status === "success" ? "Email verificado!" : "Não foi possível verificar"}</CardTitle>
          <CardDescription>
            {result.status === "success"
              ? "Sua conta foi ativada com sucesso."
              : result.message || "Tente novamente."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.status === "success" ? (
            <Button asChild className="w-full">
              <Link href="/login">Ir para o login</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="w-full" variant="outline">
                <Link href="/register">Voltar para o cadastro</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/login">Ir para o login</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
