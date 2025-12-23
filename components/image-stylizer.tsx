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
  generationId?: string
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
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [feedbackTags, setFeedbackTags] = useState<string[]>([])
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)

  const feedbackTagOptions = [
    "Pele natural",
    "Fidelidade ao rosto",
    "Cores fiéis",
    "Iluminação suave",
    "Fundo limpo",
    "Nitidez",
    "Detalhes finos",
    "Textura realista",
    "Estilo consistente",
    "Recorte perfeito",
  ]

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
        generationId: data.generationId,
      }

      setProcessedImage(processed)
      setHistory((prev) => [processed, ...prev])
      setFeedbackRating(null)
      setFeedbackComment("")
      setFeedbackTags([])

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

  async function handleSendFeedback() {
    if (!processedImage?.generationId || !feedbackRating) {
      toast({
        title: "Avaliação incompleta",
        description: "Selecione uma nota para continuar",
        variant: "destructive",
      })
      return
    }

    setIsSendingFeedback(true)

    try {
      const response = await api("/ia/feedback", {
        method: "POST",
        body: JSON.stringify({
          generationId: processedImage.generationId,
          rating: feedbackRating,
          comment: feedbackComment.trim() || undefined,
          tags: feedbackTags.length ? feedbackTags : undefined,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || error.error || "Erro ao enviar avaliação")
      }

      toast({
        title: "Feedback enviado",
        description: "Obrigado por ajudar a melhorar o resultado",
      })
    } catch (error) {
      toast({
        title: "Erro ao enviar feedback",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setIsSendingFeedback(false)
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
                <Image
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
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
                <Image
                  src={processedImage.url || "/placeholder.svg"}
                  alt="Processed"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
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

              {processedImage.generationId ? (
                <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Avalie esta imagem</p>
                    <p className="text-xs text-muted-foreground">
                      Seu feedback ajuda a ajustar os próximos resultados.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        variant={feedbackRating === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFeedbackRating(rating)}
                        disabled={isSendingFeedback}
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tags rápidas</p>
                    <div className="flex flex-wrap gap-2">
                      {feedbackTagOptions.map((tag) => {
                        const isSelected = feedbackTags.includes(tag)
                        return (
                          <Button
                            key={tag}
                            type="button"
                            variant={isSelected ? "secondary" : "outline"}
                            size="sm"
                            onClick={() =>
                              setFeedbackTags((prev) =>
                                isSelected ? prev.filter((item) => item !== tag) : [...prev, tag]
                              )
                            }
                            disabled={isSendingFeedback}
                          >
                            {tag}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback-comment">Comentário (opcional)</Label>
                    <Textarea
                      id="feedback-comment"
                      placeholder="Conte o que ficou bom ou o que você esperava diferente."
                      value={feedbackComment}
                      onChange={(event) => setFeedbackComment(event.target.value)}
                      disabled={isSendingFeedback}
                    />
                  </div>
                  <Button onClick={handleSendFeedback} disabled={isSendingFeedback}>
                    {isSendingFeedback ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando feedback
                      </>
                    ) : (
                      "Enviar avaliação"
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10">
              <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                {isProcessing ? "Processando sua imagem..." : "A imagem transformada aparecerá aqui"}
              </p>
              {isProcessing ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : null}
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
                    <Image
                      src={item.url || "/placeholder.svg"}
                      alt={`History ${index}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 120px"
                    />
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
