import type React from "react"
import type { Metadata } from "next"
import { AppHeader } from "@/components/app-header"

export const metadata: Metadata = {
  title: "Dashboard - AI Image Stylizer",
  description: "Transforme suas imagens com inteligência artificial",
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
