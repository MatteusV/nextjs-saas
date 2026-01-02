import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { AppHeader } from "@/components/app-header"

export const metadata: Metadata = {
  title: "Painel - AI Image Stylizer",
  description: "Transforme suas imagens com inteligência artificial",
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div cz-shortcut-listen="true" className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<div className="h-16 border-b border-border/40 bg-background/95" />}>
        <AppHeader />
      </Suspense>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
