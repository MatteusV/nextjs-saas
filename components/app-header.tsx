"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { AlignJustify, LogOut, Sparkles, User } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/server-actions/session"
import { NotificationBell } from "@/components/notification-bell"

interface UserData {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

function getInitials(name: string): string {
  const [first, last] = name.trim().split(" ")
  const firstInitial = first?.[0] ?? ""
  const lastInitial = last?.[0] ?? ""
  return `${firstInitial}${lastInitial}`.toUpperCase() || "US"
}

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [canUseIntegrations, setCanUseIntegrations] = useState(false)

  useEffect(() => {
    let active = true
    async function loadRole() {
      try {
        const response = await api("/users/me")
        const data = await response.json().catch(() => ({}))
        if (!response.ok) return
        if (active) {
          setIsAdmin(data.user?.role === "ADMIN")
          setCanUseIntegrations(data.user?.subscriptionPlan !== "FREE_TIER")
        }
      } catch {
        if (active) {
          setIsAdmin(false)
          setCanUseIntegrations(false)
        }
      }
    }
    loadRole()
    return () => {
      active = false
    }
  }, [])
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error("[AppHeader] Error fetching user:", error)
      }
    }

    fetchUser()
  }, [])

  async function handleLogout() {
    try {
      await api("/users/logout", { method: "POST" })
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      router.push("/login")
      router.refresh()
    }
  }

  const navItems = [
    { href: "/app", label: "Criar" },
    { href: "/app?tab=uploads", label: "Minhas imagens" },
    { href: "/app/plans", label: "Planos" },
    ...(canUseIntegrations
      ? [{ href: "/app/integrations", label: "Integrações" }]
      : []),
  ]

  const isActive = (href: string) => {
    if (href.startsWith("/app?tab=uploads")) {
      return pathname === "/app" && searchParams.get("tab") === "uploads"
    }
    if (href === "/app") {
      return pathname === "/app" && (searchParams.get("tab") ?? "create") === "create"
    }
    return pathname === href
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex h-16 justify-between items-center px-4">
        <div className="z-10 flex items-center">
          <Link href="/app" className="flex items-center gap-2 font-semibold text-lg">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>AI Stylizer</span>
          </Link>
        </div>

          <nav className="hidden items-center gap-1 md:flex absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            {isAdmin ? (
              <Button asChild variant={isActive("/dashboard") ? "secondary" : "ghost"} size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : null}
          </nav>

        <div className="flex items-center gap-2">
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir navegação">
                    <AlignJustify className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {isAdmin ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          <NotificationBell />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8">
                  {user?.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : null}
                  <AvatarFallback>
                    {user?.name ? (
                      <span className="text-xs font-medium">
                        {getInitials(user.name)}
                      </span>
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
