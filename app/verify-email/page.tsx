import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Verifique seu Email",
  description: "Confirme seu email para ativar sua conta",
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground bg-gradient-to-br from-background via-accent/20 to-primary/10 dark:via-accent/10 dark:to-primary/15 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Verifique seu email</CardTitle>
          <CardDescription>Enviamos um link de verificação para seu email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Clique no link que enviamos para ativar sua conta e começar a usar a plataforma.
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Não recebeu o email? Verifique sua caixa de spam ou entre em contato com o suporte.
          </p>
          <Button asChild className="w-full bg-transparent" variant="outline">
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
