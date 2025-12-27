"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "pwa-install-dismissed"

export function PwaInstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined" && window.sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true)
      return
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  async function handleInstall() {
    if (!promptEvent) return
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice.outcome === "accepted") {
      setPromptEvent(null)
    } else {
      setDismissed(true)
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(DISMISS_KEY, "1")
      }
    }
  }

  if (!mounted || !promptEvent || dismissed) {
    return null
  }

  return (
    <Card className="shadow-xl border-border/50 bg-card/95">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Instale o AI Stylizer</p>
          <p className="text-xs text-muted-foreground">
            Acesse mais rapido e use em tela cheia no seu celular.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setDismissed(true)
              if (typeof window !== "undefined") {
                window.sessionStorage.setItem(DISMISS_KEY, "1")
              }
            }}
          >
            Agora não
          </Button>
          <Button onClick={handleInstall}>
            <Download className="h-4 w-4" />
            Instalar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
