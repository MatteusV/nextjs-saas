"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type NotificationItem = {
  id: string
  title: string
  body: string
  audience: string
}

interface AdminNotificationHistoryDialogProps {
  notifications: NotificationItem[]
}

export function AdminNotificationHistoryDialog({
  notifications,
}: AdminNotificationHistoryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          Ver histórico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notificações recentes</DialogTitle>
          <DialogDescription>Últimos comunicados enviados aos usuários.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {notifications.length ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{notification.title}</p>
                  <Badge variant="secondary">{notification.audience}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{notification.body}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma notificação enviada ainda.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
