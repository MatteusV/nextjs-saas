"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, PlusSquare } from "lucide-react"

function isIos() {
  if (typeof window === "undefined") return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error Safari-only
    window.navigator.standalone === true
  )
}

export function PwaIosTip() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isIos() && !isStandalone()) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <Card className="shadow-xl border-border/50 bg-card/95">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Adicionar a tela inicial</p>
          <p className="text-xs text-muted-foreground">
            Toque em <Share2 className="inline h-3 w-3" /> e depois em{" "}
            <PlusSquare className="inline h-3 w-3" /> para instalar no iOS.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setVisible(false)}>
          Entendi
        </Button>
      </CardContent>
    </Card>
  )
}
