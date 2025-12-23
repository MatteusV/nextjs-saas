import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Login - AI Image Stylizer",
  description: "Faça login na sua conta",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground bg-gradient-to-br from-background via-muted/20 to-primary/5 dark:via-muted/10 dark:to-primary/15 p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Branding */}
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Image
            src="/icon-light.png"
            alt="AI Stylizer"
            width={28}
            height={28}
            className="h-7 w-7 dark:hidden"
            priority
          />
          <Image
            src="/icon-dark.png"
            alt="AI Stylizer"
            width={28}
            height={28}
            className="hidden h-7 w-7 dark:block"
            priority
          />
          <span>AI Stylizer</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <Suspense fallback={<div className="h-full w-full animate-pulse rounded-2xl bg-muted/40" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
