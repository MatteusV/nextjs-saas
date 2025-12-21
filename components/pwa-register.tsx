"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js")
      } catch (error) {
        console.warn("[PWA] Service worker registration failed", error)
      }
    }

    register()
  }, [])

  return null
}
