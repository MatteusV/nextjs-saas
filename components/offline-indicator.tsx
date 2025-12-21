"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    function update() {
      setIsOnline(navigator.onLine)
    }

    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge variant="secondary" className="gap-2">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    </div>
  )
}
