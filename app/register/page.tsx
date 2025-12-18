import type { Metadata } from "next"
import { RegisterForm } from "@/components/register-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Criar Conta - AI Image Stylizer",
  description: "Cadastre-se para começar a personalizar suas fotos com inteligência artificial",
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground bg-gradient-to-br from-background via-muted/20 to-primary/5 dark:via-muted/10 dark:to-primary/15 p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Sparkles className="w-6 h-6 text-primary" />
          <span>AI Stylizer</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Crie sua conta</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Personalize suas imagens com inteligência artificial</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
