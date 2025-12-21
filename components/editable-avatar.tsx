"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface EditableAvatarProps {
  avatarUrl?: string | null
  name: string
  className?: string
  size?: "sm" | "md" | "lg"
  onAvatarUpdate?: (newAvatarUrl: string) => void
}

const sizeMap = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
}

const iconSizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

function getInitials(name: string) {
  const [first, last] = name.trim().split(" ")
  const firstInitial = first?.[0] ?? ""
  const lastInitial = last?.[0] ?? ""
  return `${firstInitial}${lastInitial}`.toUpperCase() || "US"
}

export function EditableAvatar({
  avatarUrl,
  name,
  className,
  size = "md",
  onAvatarUpdate,
}: EditableAvatarProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB",
        variant: "destructive",
      })
      return
    }

    setPreviewUrl(URL.createObjectURL(file))
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await api("/users/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || error.error || "Erro ao fazer upload da foto")
      }

      const data = await response.json()
      const newAvatarUrl = data.avatarUrl

      if (onAvatarUpdate) {
        onAvatarUpdate(newAvatarUrl)
      }

      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso",
      })

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)

      router.refresh()
    } catch (error) {
      console.error("[EditableAvatar] Error uploading avatar:", error)
      toast({
        title: "Erro ao fazer upload",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const displayUrl = previewUrl || (avatarUrl ? `${avatarUrl}?v=${Date.now()}` : null)
  const avatarSize = sizeMap[size]
  const iconSize = iconSizeMap[size]

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={handleAvatarClick}
        disabled={isUploading}
        className="relative group cursor-pointer disabled:cursor-not-allowed"
        aria-label="Editar foto de perfil"
      >
        <Avatar className={cn(avatarSize, "ring-2 ring-background")}>
          <AvatarImage src={displayUrl || undefined} alt={`Foto de ${name}`} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
            isUploading && "opacity-100"
          )}
        >
          {isUploading ? (
            <Loader2 className={cn(iconSize, "text-white animate-spin")} />
          ) : (
            <Pencil className={cn(iconSize, "text-white")} />
          )}
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Selecionar foto de perfil"
      />
    </div>
  )
}
