import { ImageStylizer } from "@/components/image-stylizer"

export default function AppPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-balance">Personalize suas Imagens com IA</h1>
        <p className="text-lg text-muted-foreground text-pretty">
          Faça upload de uma foto e selecione um estilo para transformá-la com nosso modelo de machine learning
        </p>
      </div>

      <ImageStylizer />
    </div>
  )
}
