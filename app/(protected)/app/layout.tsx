import type React from "react"
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
      <AppHeader />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
