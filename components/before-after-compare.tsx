"use client"

import { useState } from "react"
import Image from "next/image"

interface BeforeAfterCompareProps {
  beforeUrl: string
  afterUrl: string
}

export function BeforeAfterCompare({ beforeUrl, afterUrl }: BeforeAfterCompareProps) {
  const [value, setValue] = useState(50)

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/10">
        <Image
          src={beforeUrl}
          alt="Antes"
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
          <Image
            src={afterUrl}
            alt="Depois"
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div
          className="absolute inset-y-0"
          style={{ left: `${value}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-full w-0.5 bg-primary/70" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Antes</span>
          <span>Depois</span>
        </div>
        <input
          aria-label="Comparar antes e depois"
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="w-full accent-primary"
        />
      </div>
    </div>
  )
}
