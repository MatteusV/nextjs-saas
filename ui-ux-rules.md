# UI/UX Design System - AI Stylizer

Este documento define as regras de design, componentes, cores, tipografia e padrões de layout do projeto. Use este guia como referência para manter consistência visual em toda a aplicação.

---

## 1. Tecnologias e Bibliotecas

### Framework e Ferramentas
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 16+ | Framework React com App Router |
| **React** | 19.2+ | Biblioteca UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | v4 | Estilização utility-first |
| **shadcn/ui** | latest | Biblioteca de componentes base |
| **Lucide React** | latest | Ícones |
| **next-themes** | latest | Suporte a dark/light mode |

### Dependências de UI
```bash
# Componentes já disponíveis (não precisam ser instalados)
@/components/ui/button
@/components/ui/card
@/components/ui/input
@/components/ui/label
@/components/ui/badge
@/components/ui/avatar
@/components/ui/dropdown-menu
@/components/ui/toaster
```

---

## 2. Paleta de Cores

### Design Tokens (CSS Variables)

Use **sempre** os tokens de cor ao invés de cores hardcoded. Isso garante suporte automático a dark/light mode.

#### Cores Semânticas Principais

| Token | Light Mode | Dark Mode | Uso |
|-------|------------|-----------|-----|
| `--background` | `#fdfdfd` | `#1a1b1e` | Fundo da página |
| `--foreground` | `#000000` | `#f0f0f0` | Texto principal |
| `--card` | `#fdfdfd` | `#222327` | Fundo de cards |
| `--card-foreground` | `#000000` | `#f0f0f0` | Texto em cards |
| `--primary` | `#7033ff` | `#8c5cff` | Cor de destaque principal (roxo/violeta) |
| `--primary-foreground` | `#ffffff` | `#ffffff` | Texto sobre primary |
| `--secondary` | `#edf0f4` | `#2a2c33` | Elementos secundários |
| `--muted` | `#f5f5f5` | `#2a2c33` | Backgrounds sutis |
| `--muted-foreground` | `#525252` | `#a0a0a0` | Texto secundário/placeholder |
| `--destructive` | `#e54b4f` | `#f87171` | Erros e ações destrutivas |
| `--border` | `#e7e7ee` | `#33353a` | Bordas |
| `--input` | `#ebebeb` | `#33353a` | Fundo de inputs |
| `--ring` | `#000000` | `#8c5cff` | Focus ring |

#### Cores para Gráficos e Indicadores

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--chart-1` | `#4ac885` | `#4ade80` | Sucesso/positivo (verde) |
| `--chart-2` | `#7033ff` | `#8c5cff` | Primary em gráficos |
| `--chart-3` | `#fd822b` | `#fca5a5` | Alerta/warning (laranja) |
| `--chart-4` | `#3276e4` | `#5993f4` | Info (azul) |
| `--chart-5` | `#747474` | `#a0a0a0` | Neutro |

### Como Usar no Tailwind

```tsx
// ✅ CORRETO - Use tokens semânticos
<div className="bg-background text-foreground" />
<button className="bg-primary text-primary-foreground" />
<p className="text-muted-foreground" />
<div className="border-border" />

// ❌ INCORRETO - Não use cores hardcoded
<div className="bg-white text-black" />
<button className="bg-purple-600" />
```

---

## 3. Tipografia

### Famílias de Fonte

| Família | Fonte | Uso | Classe Tailwind |
|---------|-------|-----|-----------------|
| **Sans** | Plus Jakarta Sans | Texto principal, UI | `font-sans` |
| **Mono** | IBM Plex Mono | Código, dados técnicos | `font-mono` |
| **Serif** | Lora | Títulos decorativos (opcional) | `font-serif` |

### Pesos Disponíveis

**Plus Jakarta Sans:** 200, 300, 400, 500, 600, 700, 800  
**IBM Plex Mono:** 100, 200, 300, 400, 500, 600, 700  
**Lora:** 400, 500, 600, 700

### Escala Tipográfica

| Elemento | Tamanho | Peso | Line Height | Classe Tailwind |
|----------|---------|------|-------------|-----------------|
| H1 | 2.25rem (36px) | 700 | 1.2 | `text-4xl font-bold` |
| H2 | 1.875rem (30px) | 600 | 1.25 | `text-3xl font-semibold` |
| H3 | 1.5rem (24px) | 600 | 1.3 | `text-2xl font-semibold` |
| H4 | 1.25rem (20px) | 500 | 1.4 | `text-xl font-medium` |
| Body | 1rem (16px) | 400 | 1.5 | `text-base` |
| Body Small | 0.875rem (14px) | 400 | 1.5 | `text-sm` |
| Caption | 0.75rem (12px) | 400 | 1.4 | `text-xs` |

### Regras de Tipografia

```tsx
// ✅ CORRETO
<h1 className="text-4xl font-bold tracking-tight">Título</h1>
<p className="text-base leading-relaxed text-muted-foreground">Descrição</p>

// Usar text-balance para títulos
<h2 className="text-3xl font-semibold text-balance">Título Longo</h2>

// ❌ INCORRETO - Não usar tamanhos menores que 14px para body
<p className="text-[10px]">Texto muito pequeno</p>
```

---

## 4. Espaçamento

### Escala de Espaçamento (Tailwind)

Use **sempre** a escala do Tailwind ao invés de valores arbitrários.

| Token | Valor | Uso Comum |
|-------|-------|-----------|
| `1` | 4px | Micro espaçamento |
| `2` | 8px | Espaçamento entre elementos inline |
| `3` | 12px | Padding interno pequeno |
| `4` | 16px | Padding padrão, gaps |
| `6` | 24px | Seções menores |
| `8` | 32px | Seções médias |
| `12` | 48px | Seções grandes |
| `16` | 64px | Margens de página |

### Padrões de Espaçamento

```tsx
// Espaçamento entre elementos em lista/form
<div className="space-y-4">...</div>

// Gap em grids/flex
<div className="flex gap-4">...</div>
<div className="grid gap-6">...</div>

// Padding de containers
<div className="p-4 md:p-6 lg:p-8">...</div>

// ❌ EVITAR valores arbitrários
<div className="p-[13px]">...</div>
```

---

## 5. Layout

### Método de Layout (Prioridade)

1. **Flexbox** - Para a maioria dos layouts
2. **CSS Grid** - Apenas para layouts 2D complexos
3. **Absolute/Fixed** - Apenas quando necessário (modais, tooltips)

### Containers

```tsx
// Container padrão
<div className="container mx-auto px-4">...</div>

// Container com max-width
<div className="max-w-md mx-auto">...</div>   // Forms, cards isolados
<div className="max-w-2xl mx-auto">...</div>  // Conteúdo de leitura
<div className="max-w-7xl mx-auto">...</div>  // Layouts amplos
```

### Grid Responsivo

```tsx
// Grid padrão 2 colunas em desktop
<div className="grid gap-6 lg:grid-cols-2">...</div>

// Grid de cards
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">...</div>

// Grid span
<div className="lg:col-span-2">...</div>
```

### Breakpoints

| Breakpoint | Largura | Uso |
|------------|---------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop grande |
| `2xl` | 1536px | Monitores ultra-wide |

---

## 6. Componentes

### Botões

```tsx
// Botão primário (ação principal)
<Button>Criar conta</Button>
<Button size="lg">Transformar Imagem</Button>

// Botão secundário
<Button variant="secondary">Cancelar</Button>

// Botão ghost (ações terciárias)
<Button variant="ghost">Voltar</Button>

// Botão destrutivo
<Button variant="destructive">Excluir</Button>

// Botão com ícone
<Button>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processando...
</Button>

// Botão ícone
<Button size="icon" variant="ghost">
  <Settings className="h-4 w-4" />
</Button>
```

### Cards

```tsx
<Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="w-5 h-5" />
      Título do Card
    </CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Conteúdo */}
  </CardContent>
  <CardFooter>
    {/* Ações */}
  </CardFooter>
</Card>
```

### Inputs e Forms

```tsx
// Input padrão
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="seu@email.com"
    className={errors.email ? "border-destructive" : ""}
  />
  {errors.email && (
    <p className="text-sm text-destructive flex items-center gap-1">
      <XCircle className="w-3 h-3" />
      {errors.email}
    </p>
  )}
</div>

// Input com ícone toggle (ex: senha)
<div className="relative">
  <Input type={showPassword ? "text" : "password"} className="pr-10" />
  <button
    type="button"
    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
  >
    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
  </button>
</div>
```

### Alertas e Feedback

```tsx
// Mensagem de erro inline
<div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
  <AlertCircle className="w-4 h-4 shrink-0" />
  <span>Mensagem de erro</span>
</div>

// Toast (via hook)
const { toast } = useToast()

// Sucesso
toast({
  title: "Sucesso!",
  description: "Ação realizada com sucesso",
})

// Erro
toast({
  title: "Erro",
  description: "Algo deu errado",
  variant: "destructive",
})
```

### Badges

```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>
```

---

## 7. Ícones

### Biblioteca: Lucide React

```tsx
import { Loader2, Eye, EyeOff, XCircle, AlertCircle, Upload, Download, Wand2, Sparkles, User, LogOut, Settings, ImageIcon, Check, ChevronRight } from 'lucide-react'
```

### Tamanhos Padrão

| Contexto | Classe | Tamanho |
|----------|--------|---------|
| Inline com texto | `w-4 h-4` | 16px |
| Botões | `w-4 h-4` ou `w-5 h-5` | 16-20px |
| Cards/Headers | `w-5 h-5` ou `w-6 h-6` | 20-24px |
| Empty states | `w-12 h-12` ou `w-16 h-16` | 48-64px |

---

## 8. Estados e Interações

### Estados de Loading

```tsx
// Botão com loading
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Processando...
    </>
  ) : (
    "Enviar"
  )}
</Button>

// Área de loading
<div className="flex items-center justify-center h-64">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
</div>
```

### Estados de Hover/Focus

```tsx
// Transições suaves
className="transition-colors"
className="transition-all"

// Hover em elementos interativos
className="hover:bg-muted/50"
className="hover:border-primary/50"
className="hover:text-foreground"

// Focus ring (automático via shadcn)
className="focus-visible:ring-2 focus-visible:ring-ring"
```

### Estados de Seleção

```tsx
// Elemento selecionável
<button
  className={`p-3 rounded-lg border-2 transition-all ${
    isSelected
      ? "border-primary bg-primary/5 shadow-sm"
      : "border-border hover:border-primary/50 hover:bg-muted/50"
  }`}
>
```

---

## 9. Sombras e Elevação

### Sistema de Sombras

| Token | Uso |
|-------|-----|
| `shadow-sm` | Elementos sutis |
| `shadow` / `shadow-md` | Cards, dropdowns |
| `shadow-lg` | Modais, popovers |
| `shadow-xl` | Cards destacados |

```tsx
// Card com sombra destacada
<Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
```

---

## 10. Border Radius

### Escala de Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-sm` | ~10px | Badges, pills |
| `rounded-md` | ~12px | Inputs, botões pequenos |
| `rounded-lg` | 1.4rem (~22px) | Cards, containers |
| `rounded-xl` | ~26px | Cards grandes |
| `rounded-full` | 50% | Avatares, botões circulares |

---

## 11. Padrões de Página

### Layout de Página Pública (Login/Register)

```tsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
  {/* Header */}
  <header className="p-4 flex justify-between items-center">
    <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
      <Sparkles className="w-6 h-6 text-primary" />
      <span>AI Stylizer</span>
    </Link>
    <ThemeToggle />
  </header>

  {/* Content */}
  <main className="flex-1 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <Card>...</Card>
    </div>
  </main>

  {/* Footer */}
  <footer className="p-4 text-center text-sm text-muted-foreground">
    © 2025 AI Stylizer. Todos os direitos reservados.
  </footer>
</div>
```

### Layout de Página Protegida (App)

```tsx
<div className="min-h-screen bg-background">
  {/* Header fixo */}
  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-16 items-center justify-between px-4">
      {/* Logo, nav, user menu */}
    </div>
  </header>

  {/* Main content */}
  <main className="container py-6 px-4">
    {/* Conteúdo da página */}
  </main>
</div>
```

---

## 12. Dark Mode

### Implementação

O tema é gerenciado via `next-themes` e o componente `ThemeProvider`.

```tsx
// Usar em qualquer componente
import { useTheme } from "@/components/theme-provider"

const { theme, setTheme } = useTheme()

// Alternar tema
setTheme("light")  // ou "dark" ou "system"
```

### Boas Práticas

1. **Sempre use tokens semânticos** - Nunca use cores fixas como `bg-white` ou `text-black`
2. **Teste ambos os temas** - Verifique contraste e legibilidade
3. **Opacidades para sobreposições** - Use `bg-background/95` para overlays
4. **Bordas adaptativas** - Use `border-border` ao invés de cores fixas

---

## 13. Acessibilidade

### Checklist

- [ ] Contraste mínimo 4.5:1 para texto
- [ ] Labels em todos os inputs (`htmlFor` + `id`)
- [ ] Estados de focus visíveis
- [ ] Textos alternativos em imagens
- [ ] Hierarquia de headings correta (h1 → h2 → h3)
- [ ] Botões com texto descritivo ou `aria-label`
- [ ] Mensagens de erro associadas aos campos

### Classes de Acessibilidade

```tsx
// Texto apenas para screen readers
<span className="sr-only">Descrição para leitores de tela</span>

// Skip link (opcional)
<a href="#main" className="sr-only focus:not-sr-only">
  Pular para conteúdo
</a>
```

---

## 14. Animações

### Animações Padrão

```tsx
// Spinner de loading
<Loader2 className="animate-spin" />

// Transição de cores
className="transition-colors"

// Transição completa
className="transition-all"

// Duração customizada
className="transition-all duration-300"
```

### Regras

1. Use animações com moderação
2. Respeite `prefers-reduced-motion`
3. Durações entre 150ms-300ms para micro-interações
4. Evite animações que bloqueiam interação

---

## 15. Convenções de Código

### Nomenclatura de Arquivos

```
components/
├── ui/               # Componentes base (shadcn)
├── app-header.tsx    # Componentes específicos (kebab-case)
├── login-form.tsx
├── register-form.tsx
├── image-stylizer.tsx
└── theme-provider.tsx
```

### Estrutura de Componente

```tsx
"use client" // Se necessário

import type React from "react"
import { useState } from "react"
// ... outros imports

interface ComponentProps {
  // Props tipadas
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks
  const [state, setState] = useState()
  
  // Handlers
  function handleAction() {}
  
  // Render
  return (
    <div>...</div>
  )
}
```

---

## Resumo Rápido

| Aspecto | Padrão |
|---------|--------|
| **Cor primária** | `--primary` (#7033ff light / #8c5cff dark) |
| **Fonte principal** | Plus Jakarta Sans |
| **Tamanho base** | 16px |
| **Espaçamento padrão** | 16px (p-4, gap-4) |
| **Border radius** | 1.4rem (rounded-lg) |
| **Sombra de cards** | shadow-xl |
| **Ícones** | Lucide React, 16-24px |
| **Layout** | Flexbox first, Grid quando necessário |
