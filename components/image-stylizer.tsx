"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Wand2, Download, Loader2, ImageIcon, XCircle } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

const STYLE_OPTIONS = [
  { id: "artistic", name: "Artístico", description: "Estilo de pintura artística" },
  { id: "anime", name: "Anime", description: "Estilo anime japonês" },
  { id: "cartoon", name: "Cartoon", description: "Desenho animado" },
  { id: "abstract", name: "Abstrato", description: "Arte abstrata moderna" },
  { id: "watercolor", name: "Aquarela", description: "Efeito de aquarela" },
  { id: "oil-painting", name: "Óleo", description: "Pintura a óleo clássica" },
  { id: "sketch", name: "Esboço", description: "Desenho a lápis" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Estilo futurista neon" },
]

interface ProcessedImage {
  url: string
  style: string
  timestamp: number
}

export function ImageStylizer() {
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [promptText, setPromptText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null)
  const [history, setHistory] = useState<ProcessedImage[]>([])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
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

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setProcessedImage(null)
  }

  function handleClearImage() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setProcessedImage(null)
    setSelectedStyle("")
    setPromptText("")
  }

  function handleStyleSelect(styleId: string) {
    setSelectedStyle(styleId)
  }

  async function handleProcess() {
    if (!selectedFile || !selectedStyle) {
      toast({
        title: "Dados incompletos",
        description: "Selecione uma imagem e um estilo",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("style", selectedStyle)
      if (promptText.trim()) {
        formData.append("prompt", promptText.trim())
      }

      // Cookie-based session auth: api() sends credentials: include.
      const response = await api("/ia/send-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || error.error || "Erro ao processar imagem")
      }

      const data = await response.json()

      const processed: ProcessedImage = {
        url: data.dataUrl || previewUrl || "/placeholder.svg",
        style: selectedStyle,
        timestamp: Date.now(),
      }

      setProcessedImage(processed)
      setHistory((prev) => [processed, ...prev])

      toast({
        title: "Imagem enviada!",
        description: "A rota recebeu a imagem com sucesso",
      })
    } catch (error) {
      console.error("[v0] Error processing image:", error)
      toast({
        title: "Erro ao processar",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDownload() {
    if (!processedImage) return

    try {
      const response = await fetch(processedImage.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `stylized-${processedImage.style}-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download iniciado",
        description: "Sua imagem está sendo baixada",
      })
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload e Estilo
          </CardTitle>
          <CardDescription>Faça upload da sua imagem e escolha um estilo de transformação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Imagem</Label>
            {!previewUrl ? (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/10"
              >
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-12 h-12" />
                  <p className="text-sm font-medium">Clique para fazer upload</p>
                  <p className="text-xs">PNG, JPG ou WEBP (máx. 10MB)</p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
              </label>
            ) : (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
                <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleClearImage}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Estilo de Transformação</Label>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleSelect(style.id)}
                  disabled={isProcessing}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedStyle === style.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="font-medium text-sm">{style.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Descreva o resultado que voce quer (opcional)"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <Button
            onClick={handleProcess}
            disabled={!selectedFile || !selectedStyle || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando com IA...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Transformar Imagem
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Resultado
          </CardTitle>
          <CardDescription>Sua imagem transformada aparecerá aqui</CardDescription>
        </CardHeader>
        <CardContent>
          {processedImage ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted/10">
                <Image src={processedImage.url || "/placeholder.svg"} alt="Processed" fill className="object-contain" />
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-sm">
                  Estilo: {STYLE_OPTIONS.find((s) => s.id === processedImage.style)?.name}
                </Badge>
                <Button onClick={handleDownload} variant="default">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10">
              <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                {isProcessing ? "Processando sua imagem..." : "A imagem transformada aparecerá aqui"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>Suas transformações recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {history.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <Image src={item.url || "/placeholder.svg"} alt={`History ${index}`} fill className="object-cover" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {STYLE_OPTIONS.find((s) => s.id === item.style)?.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
