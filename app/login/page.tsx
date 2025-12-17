import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Login - AI Image Stylizer",
  description: "Faça login na sua conta",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Branding */}
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Sparkles className="w-6 h-6 text-primary" />
          <span>AI Stylizer</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
