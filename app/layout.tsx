import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PwaRegister } from "@/components/pwa-register"
import { PwaInstallBanner } from "@/components/pwa-install-banner"
import { PwaIosTip } from "@/components/pwa-ios-tip"
import { OfflineIndicator } from "@/components/offline-indicator"

export const metadata: Metadata = {
  title: "AI Stylizer",
  description: "Personalize suas imagens com IA",
  generator: "v0.app",
  applicationName: "AI Stylizer",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Stylizer",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport = {
  themeColor: "#7033ff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="saas-theme">
          {children}
          <Toaster />
          <PwaRegister />
          <OfflineIndicator />
          <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
            <div className="w-full max-w-lg pointer-events-auto">
              <PwaInstallBanner />
              <div className="mt-3">
                <PwaIosTip />
              </div>
            </div>
          </div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
