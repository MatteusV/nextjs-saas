import type React from "react"
import type { Metadata } from "next"
import { AppHeader } from "@/components/app-header"

export const metadata: Metadata = {
  title: "Admin Dashboard - AI Image Stylizer",
  description: "Painel administrativo da plataforma",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
