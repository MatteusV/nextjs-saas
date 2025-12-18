import type React from "react"
import type { Metadata } from "next"
import { AppHeader } from "@/components/app-header"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Dashboard - AI Image Stylizer",
  description: "Transforme suas imagens com inteligência artificial",
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login?redirect=/app")
  }

  return (
    <div cz-shortcut-listen="true" className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
