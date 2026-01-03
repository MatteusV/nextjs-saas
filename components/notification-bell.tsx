"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, BellRing, Loader2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"

type NotificationItem = {
  id: string
  title: string
  body: string
  createdAt: string
  readAt: string | null
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function NotificationBell() {
  const { toast } = useToast()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [showSettings, setShowSettings] = useState(false)

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readAt).length,
    [items]
  )

  useEffect(() => {
    setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    let active = true
    async function loadNotifications() {
      try {
        const response = await api("/notifications")
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar notificações")
        }
        if (active) {
          setItems(data.notifications ?? [])
        }
      } catch (error) {
        if (active) {
          toast({
            title: "Falha ao carregar notificações",
            description: error instanceof Error ? error.message : "Tente novamente",
            variant: "destructive",
          })
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadNotifications()
    return () => {
      active = false
    }
  }, [toast])

  async function markAsRead(ids: string[]) {
    if (!ids.length) return
    try {
      await api("/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: ids }),
      })
      setItems((prev) =>
        prev.map((item) =>
          ids.includes(item.id) ? { ...item, readAt: new Date().toISOString() } : item
        )
      )
    } catch {
      // silent
    }
  }

  async function markAllAsRead() {
    try {
      await api("/notifications/read", { method: "PUT" })
      setItems((prev) =>
        prev.map((item) =>
          item.readAt ? item : { ...item, readAt: new Date().toISOString() }
        )
      )
    } catch {
      // silent
    }
  }

  async function handleEnablePush() {
    if (!VAPID_PUBLIC_KEY) {
      toast({
        title: "Push indisponível",
        description: "Configure a chave pública VAPID para ativar o push.",
        variant: "destructive",
      })
      return
    }

    setIsSubscribing(true)
    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("Seu navegador não suporta notificações push.")
      }

      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)
      if (permissionResult !== "granted") {
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }))

      await api("/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      })

      toast({
        title: "Push ativado",
        description: "Agora você receberá avisos diretamente no seu dispositivo.",
      })
    } catch (error) {
      toast({
        title: "Não foi possível ativar o push",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  async function handleDisablePush() {
    setIsSubscribing(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        return
      }

      await api("/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })
      await subscription.unsubscribe()
      setPermission("default")
      toast({
        title: "Push desativado",
        description: "Você pode reativar quando quiser.",
      })
    } catch (error) {
      toast({
        title: "Não foi possível desativar",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  const icon = unreadCount > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          {icon}
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
              {unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notificações</span>
          <div className="flex items-center gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            <Button
              size="icon"
              variant={showSettings ? "secondary" : "ghost"}
              className="h-7 w-7"
              onClick={() => setShowSettings((prev) => !prev)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && !isLoading ? (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            Nenhuma notificação por enquanto.
          </DropdownMenuItem>
        ) : null}
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="flex flex-col items-start gap-1 whitespace-normal last:border-b-0"
            onSelect={() => markAsRead([item.id])}
          >
            <span className="text-sm font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.body}</span>
            {!item.readAt ? (
              <Badge variant="secondary" className="mt-1 text-[10px]">
                Novo
              </Badge>
            ) : null}
          </DropdownMenuItem>
        ))}
        {showSettings ? (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 pb-3 pt-2 space-y-2">
              {permission !== "granted" ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Ative o push para receber avisos mesmo com o app fechado.
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={handleEnablePush}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? "Ativando..." : "Ativar notificações"}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Push ativo para avisos em tempo real.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={handleDisablePush}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? "Atualizando..." : "Desativar push"}
                  </Button>
                </>
              )}
              {unreadCount > 0 ? (
                <Button size="sm" variant="secondary" className="w-full" onClick={markAllAsRead}>
                  Marcar tudo como lido
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
