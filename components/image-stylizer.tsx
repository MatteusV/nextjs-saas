"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Wand2, Download, Loader2, ImageIcon, XCircle, BookmarkPlus, Trash2, Crop, Save } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { api } from "@/utils/api"
import { BeforeAfterCompare } from "@/components/before-after-compare"
import { SelectCollectionDialog } from "@/components/select-collection-dialog"
import Link from "next/link"
import { BuyCreditsButton } from "@/components/buy-credits-button"

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
  finalPrompt?: string | null
}

interface PresetItem {
  id: string
  name: string
  style: string | null
  prompt: string | null
  intent?: string | null
  emotion?: string | null
  lighting?: string | null
  palette?: string | null
  framing?: string | null
  details?: string | null
  tags: string[]
}

interface VariationItem {
  url: string
  generationId?: string
}

interface CropItem {
  aspectRatio: string
  url: string
  blobUrl?: string | null
}

type CollectionItem = {
  id: string
  name: string
}

const CROP_OPTIONS = [
  { id: "1:1", label: "1:1" },
  { id: "4:5", label: "4:5" },
  { id: "9:16", label: "9:16" },
  { id: "16:9", label: "16:9" },
]

export function ImageStylizer() {
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [promptText, setPromptText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null)
  const [variations, setVariations] = useState<VariationItem[]>([])
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false)
  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState("")
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [canSaveUploads, setCanSaveUploads] = useState(true)
  const [saveTarget, setSaveTarget] = useState<{
    dataUrl: string
    generationId?: string
    style?: string
    prompt?: string | null
  } | null>(null)
  const [isSavingUpload, setIsSavingUpload] = useState(false)
  const [presets, setPresets] = useState<PresetItem[]>([])
  const [presetName, setPresetName] = useState("")
  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [guidedFields, setGuidedFields] = useState({
    intent: "",
    emotion: "",
    lighting: "",
    palette: "",
    framing: "",
    details: "",
  })
  const [cropResults, setCropResults] = useState<CropItem[]>([])
  const [isCropping, setIsCropping] = useState(false)
  const [history, setHistory] = useState<ProcessedImage[]>([])
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [feedbackTags, setFeedbackTags] = useState<string[]>([])
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)
  const [limitNotice, setLimitNotice] = useState<{
    message: string
    upgradeUrl: string
    canBuyCredits: boolean
  } | null>(null)

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

  useEffect(() => {
    let isMounted = true

    async function loadPresets() {
      try {
        const response = await api("/presets")
        if (!response.ok) return
        const data = await response.json()
        if (isMounted) {
          setPresets(data.presets ?? [])
        }
      } catch (error) {
        console.error("[presets] Failed to load presets:", error)
      }
    }

    loadPresets()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadCollections() {
      try {
        const response = await api("/collections")
        if (!response.ok) return
        const data = await response.json()
        if (isMounted) {
          setCollections(data.collections ?? [])
        }
      } catch (error) {
        console.error("[collections] Failed to load collections:", error)
      }
    }

    loadCollections()

    return () => {
      isMounted = false
    }
  }, [])

  function handleClearImage() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setProcessedImage(null)
    setVariations([])
    setCropResults([])
    setSelectedStyle("")
    setPromptText("")
    setGuidedFields({
      intent: "",
      emotion: "",
      lighting: "",
      palette: "",
      framing: "",
      details: "",
    })
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
    setLimitNotice(null)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("style", selectedStyle)
      if (promptText.trim()) {
        formData.append("prompt", promptText.trim())
      }
      formData.append("guidedIntent", guidedFields.intent)
      formData.append("guidedEmotion", guidedFields.emotion)
      formData.append("guidedLighting", guidedFields.lighting)
      formData.append("guidedPalette", guidedFields.palette)
      formData.append("guidedFraming", guidedFields.framing)
      formData.append("guidedDetails", guidedFields.details)

      // Cookie-based session auth: api() sends credentials: include.
      const response = await api("/ia/send-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        if (error.code === "LIMIT_REACHED") {
          setLimitNotice({
            message: error.error || "Limite de gerações atingido",
            upgradeUrl: error.upgradeUrl || "/app/plans",
            canBuyCredits: Boolean(error.canBuyCredits),
          })
          return
        }
        throw new Error(error.message || error.error || "Erro ao processar imagem")
      }

      const data = await response.json()

      const processed: ProcessedImage = {
        url: data.dataUrl || previewUrl || "/placeholder.svg",
        style: selectedStyle,
        timestamp: Date.now(),
        generationId: data.generationId,
        finalPrompt: data.prompt ?? null,
      }

      setProcessedImage(processed)
      setCanSaveUploads(Boolean(data.canSave))
      setHistory((prev) => [processed, ...prev])
      setVariations([])
      setCropResults([])
      setFeedbackRating(null)
      setFeedbackComment("")
      setFeedbackTags([])
      setSelectedCollectionId("")
      setSaveTarget({
        dataUrl: processed.url,
        generationId: processed.generationId,
        style: processed.style,
        prompt: processed.finalPrompt ?? undefined,
      })

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

  async function handleSavePreset() {
    if (!presetName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe um nome para salvar o preset",
        variant: "destructive",
      })
      return
    }

    setIsSavingPreset(true)

    try {
      const response = await api("/presets", {
        method: "POST",
        body: JSON.stringify({
          name: presetName.trim(),
          style: selectedStyle || undefined,
          prompt: promptText.trim() || undefined,
          intent: guidedFields.intent.trim() || undefined,
          emotion: guidedFields.emotion.trim() || undefined,
          lighting: guidedFields.lighting.trim() || undefined,
          palette: guidedFields.palette.trim() || undefined,
          framing: guidedFields.framing.trim() || undefined,
          details: guidedFields.details.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Erro ao salvar preset")
      }

      const data = await response.json()
      setPresets((prev) => [data.preset, ...prev])
      setPresetName("")

      toast({
        title: "Preset salvo",
        description: "Seu estilo foi guardado para reutilizar depois",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar preset",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsSavingPreset(false)
    }
  }

  async function handleDeletePreset(id: string) {
    try {
      await api(`/presets/${id}`, { method: "DELETE" })
      setPresets((prev) => prev.filter((preset) => preset.id !== id))
    } catch (error) {
      console.error("[presets] Failed to delete preset:", error)
    }
  }

  function handleApplyPreset(preset: PresetItem) {
    setSelectedStyle(preset.style ?? "")
    setPromptText(preset.prompt ?? "")
    setGuidedFields({
      intent: preset.intent ?? "",
      emotion: preset.emotion ?? "",
      lighting: preset.lighting ?? "",
      palette: preset.palette ?? "",
      framing: preset.framing ?? "",
      details: preset.details ?? "",
    })
  }

  async function handleGenerateVariations() {
    if (!selectedFile || !processedImage?.generationId) return

    setIsGeneratingVariations(true)
    setLimitNotice(null)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("generationId", processedImage.generationId)
      formData.append("count", "3")

      const response = await api("/ia/variations", { method: "POST", body: formData })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        if (error.code === "LIMIT_REACHED") {
          setLimitNotice({
            message: error.error || "Limite de gerações atingido",
            upgradeUrl: error.upgradeUrl || "/app/plans",
            canBuyCredits: Boolean(error.canBuyCredits),
          })
          return
        }
        throw new Error(error.error || "Erro ao gerar variações")
      }

      const data = await response.json()
      setVariations(
        (data.variations ?? []).map((item: VariationItem) => ({
          url: item.dataUrl || "/placeholder.svg",
          generationId: item.generationId,
        }))
      )
    } catch (error) {
      toast({
        title: "Erro ao gerar variações",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingVariations(false)
    }
  }

  async function handleCrop(aspectRatio: string) {
    if (!processedImage?.generationId) return

    setIsCropping(true)

    try {
      const response = await api("/ia/crop", {
        method: "POST",
        body: JSON.stringify({
          generationId: processedImage.generationId,
          aspectRatio,
          dataUrl: processedImage.url.startsWith("data:") ? processedImage.url : undefined,
          sourceUrl: processedImage.url.startsWith("http") ? processedImage.url : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Erro ao criar recorte")
      }

      const data = await response.json()
      setCropResults((prev) => [
        {
          aspectRatio,
          url: data.blobUrl || data.dataUrl,
          blobUrl: data.blobUrl ?? null,
        },
        ...prev,
      ])
    } catch (error) {
      toast({
        title: "Erro ao criar recorte",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsCropping(false)
    }
  }

  function openSaveDialog(target: { dataUrl: string; generationId?: string; style?: string; prompt?: string | null }) {
    setSaveTarget(target)
    setSelectedCollectionId("")
    setSaveDialogOpen(true)
  }

  async function handleSaveToCollection() {
    if (!saveTarget) return
    setIsSavingUpload(true)

    try {
      const response = await api("/uploads/save", {
        method: "POST",
        body: JSON.stringify({
          dataUrl: saveTarget.dataUrl,
          generationId: saveTarget.generationId,
          style: saveTarget.style,
          prompt: saveTarget.prompt,
          collectionId: selectedCollectionId || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível salvar a imagem")
      }

      toast({
        title: "Imagem salva",
        description: "A imagem foi adicionada à coleção selecionada.",
      })
      setSaveDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsSavingUpload(false)
    }
  }

  async function handleDownload() {
    if (!processedImage) return

    try {
      await handleDownloadUrl(processedImage.url, `stylized-${processedImage.style}`)
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem",
        variant: "destructive",
      })
    }
  }

  async function handleDownloadUrl(url: string, filenamePrefix: string) {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = `${filenamePrefix}-${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)

    toast({
      title: "Download iniciado",
      description: "Sua imagem está sendo baixada",
    })
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
    <>
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

          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <p className="text-sm font-medium">Prompt guiado</p>
              <p className="text-xs text-muted-foreground">
                Preencha os campos opcionais para detalhar a edição sem complicar o texto.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guided-intent">Objetivo</Label>
                <Input
                  id="guided-intent"
                  placeholder="Ex: deixar mais profissional"
                  value={guidedFields.intent}
                  onChange={(event) =>
                    setGuidedFields((prev) => ({ ...prev, intent: event.target.value }))
                  }
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guided-emotion">Emoção</Label>
                <Input
                  id="guided-emotion"
                  placeholder="Ex: confiante, calmo"
                  value={guidedFields.emotion}
                  onChange={(event) =>
                    setGuidedFields((prev) => ({ ...prev, emotion: event.target.value }))
                  }
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guided-lighting">Iluminação</Label>
                <Input
                  id="guided-lighting"
                  placeholder="Ex: luz suave, contraluz"
                  value={guidedFields.lighting}
                  onChange={(event) =>
                    setGuidedFields((prev) => ({ ...prev, lighting: event.target.value }))
                  }
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guided-palette">Paleta</Label>
                <Input
                  id="guided-palette"
                  placeholder="Ex: tons frios, pastel"
                  value={guidedFields.palette}
                  onChange={(event) =>
                    setGuidedFields((prev) => ({ ...prev, palette: event.target.value }))
                  }
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guided-framing">Enquadramento</Label>
                <Input
                  id="guided-framing"
                  placeholder="Ex: close no rosto"
                  value={guidedFields.framing}
                  onChange={(event) =>
                    setGuidedFields((prev) => ({ ...prev, framing: event.target.value }))
                  }
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guided-details">Detalhes</Label>
                <Input
                  id="guided-details"
                  placeholder="Ex: pele mais uniforme, fundo limpo"
                  value={guidedFields.details}
                  onChange={(event) =>
                    setGuidedFields((prev) => ({ ...prev, details: event.target.value }))
                  }
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <p className="text-sm font-medium">Presets salvos</p>
              <p className="text-xs text-muted-foreground">
                Salve sua combinacao para aplicar em novas imagens.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                id="preset-name"
                placeholder="Nome do preset"
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
                disabled={isProcessing || isSavingPreset}
              />
              <Button
                type="button"
                onClick={handleSavePreset}
                disabled={isProcessing || isSavingPreset || !presetName.trim()}
              >
                {isSavingPreset ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="mr-2 h-4 w-4" />
                    Salvar preset
                  </>
                )}
              </Button>
            </div>
            {presets.length ? (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-background/80 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.style ? `Estilo: ${preset.style}` : "Estilo livre"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleApplyPreset(preset)}>
                        Aplicar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum preset salvo ainda.</p>
            )}
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
          {limitNotice ? (
            <div className="mb-4 rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Limite atingido</p>
                <p className="text-xs text-muted-foreground">{limitNotice.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={limitNotice.upgradeUrl}>Ver planos</Link>
                </Button>
                {limitNotice.canBuyCredits ? (
                  <BuyCreditsButton size="sm" label="Comprar créditos" />
                ) : null}
              </div>
            </div>
          ) : null}
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
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                  <Button
                    onClick={() =>
                      openSaveDialog({
                        dataUrl: processedImage.url,
                        generationId: processedImage.generationId,
                        style: processedImage.style,
                        prompt: processedImage.finalPrompt ?? undefined,
                      })
                    }
                    disabled={!canSaveUploads}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </div>

              {previewUrl ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Antes e depois</p>
                  <BeforeAfterCompare beforeUrl={previewUrl} afterUrl={processedImage.url} />
                </div>
              ) : null}

              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Variações rápidas</p>
                    <p className="text-xs text-muted-foreground">
                      Gere novas versões mantendo o mesmo estilo e prompt.
                  </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGenerateVariations}
                    disabled={isGeneratingVariations || !processedImage.generationId || !selectedFile}
                  >
                    {isGeneratingVariations ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Gerar variações
                      </>
                    )}
                  </Button>
                </div>
                {variations.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {variations.map((variation, index) => (
                      <div
                        key={`${variation.url}-${index}`}
                        className="rounded-lg border border-border bg-background/80 p-3 space-y-2"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted/10">
                          <Image
                            src={variation.url}
                            alt={`Variação ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleDownloadUrl(variation.url, `variation-${index + 1}`)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Baixar variação
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={() =>
                              openSaveDialog({
                                dataUrl: variation.url,
                                generationId: variation.generationId,
                                style: selectedStyle,
                                prompt: processedImage?.finalPrompt ?? undefined,
                              })
                            }
                            disabled={!canSaveUploads}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Salvar na coleção
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Gere variações para comparar opções rapidamente.
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Recortes prontos</p>
                    <p className="text-xs text-muted-foreground">
                      Exporte versões otimizadas para redes sociais e perfil.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CROP_OPTIONS.map((option) => (
                      <Button
                        key={option.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCrop(option.id)}
                        disabled={isCropping}
                      >
                        <Crop className="mr-2 h-4 w-4" />
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {cropResults.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {cropResults.map((crop, index) => (
                      <div
                        key={`${crop.aspectRatio}-${index}`}
                        className="rounded-lg border border-border bg-background/80 p-3 space-y-2"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted/10">
                          <Image
                            src={crop.url}
                            alt={`Recorte ${crop.aspectRatio}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Formato {crop.aspectRatio}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleDownloadUrl(crop.url, `crop-${crop.aspectRatio}`)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Baixar recorte
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Escolha um formato para gerar o recorte.
                  </p>
                )}
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
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={isSelected ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}
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
      <SelectCollectionDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        collections={collections}
        selectedId={selectedCollectionId}
        onSelect={setSelectedCollectionId}
        onSave={handleSaveToCollection}
        isSaving={isSavingUpload}
      />
    </>
  )
}
