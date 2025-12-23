# 🚀 Guia de Melhorias de Performance

Este documento contém análises detalhadas e recomendações para otimizar a performance da aplicação AI Stylizer.

## 📊 Análise Atual de Performance

### Métricas Coletadas

#### Tempos de Carregamento (Página `/app`)
- **TTFB (Time to First Byte)**: ~200ms ✅ Bom
- **HTML Inicial**: ~200ms ✅ Bom
- **Chunks JavaScript**: ~250ms (carregamento paralelo) ✅ Bom
- **Total até Interatividade**: ~400-500ms ✅ Bom
- **APIs**: `/api/users/me` e `/api/notifications` ~570ms ✅ Adequado

#### Status Geral
| Métrica | Status | Observação |
|---------|--------|------------|
| TTFB | ✅ Bom | ~200ms |
| FCP (First Contentful Paint) | ✅ Bom | ~400ms estimado |
| LCP (Largest Contentful Paint) | ⚠️ Moderado | Depende do conteúdo |
| Interatividade | ✅ Bom | ~400-500ms |
| Bundle Size | ⚠️ Moderado | Múltiplos chunks pequenos |
| API Response | ✅ Bom | < 600ms |

---

## ✅ Otimizações Já Implementadas

1. **Code Splitting Automático**
   - Next.js divide automaticamente em chunks
   - Chunks carregados sob demanda
   - ~20 chunks JavaScript identificados

2. **Service Worker (PWA)**
   - Cache de assets estáticos
   - Cache runtime para navegação
   - Suporte offline implementado

3. **Vercel Speed Insights**
   - Monitoramento de Web Vitals
   - Coleta de métricas reais de usuários

4. **Fontes Otimizadas**
   - Google Fonts com `next/font`
   - Subset latin para reduzir tamanho
   - Preload automático

5. **Server-Side Rendering**
   - Páginas renderizadas no servidor
   - Dados carregados no servidor (Prisma)

---

## 🔴 Problemas Identificados

### 1. Imagens Não Otimizadas ⚠️ CRÍTICO

**Problema:**
```javascript
// next.config.mjs
images: {
  unoptimized: true,  // ⚠️ Desabilita otimização de imagens
}
```

**Impacto:**
- Imagens maiores e mais lentas
- Maior uso de banda
- Pior experiência em dispositivos móveis
- Afeta LCP (Largest Contentful Paint)

**Solução:**
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remover ou alterar para:
  images: {
    // unoptimized: true,  // REMOVER ESTA LINHA
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

**Benefícios:**
- Redução de 30-50% no tamanho das imagens
- Melhor LCP
- Melhor experiência em mobile

---

### 2. Múltiplas Fontes Carregadas ⚠️ MODERADO

**Problema:**
```typescript
// app/layout.tsx
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"], // 8 pesos!
})

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"], 
  weight: ["100", "200", "300", "400", "500", "600", "700"] // 7 pesos!
})

const lora = Lora({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"] // 4 pesos
})
```

**Impacto:**
- ~100-200KB adicionais de fontes
- Múltiplas requisições HTTP
- Atraso no FCP (First Contentful Paint)

**Solução:**
```typescript
// app/layout.tsx
// Reduzir pesos apenas aos necessários
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Apenas os usados
  display: 'swap', // Melhora FCP
})

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "500"], // Apenas os usados
  display: 'swap',
})

const lora = Lora({ 
  subsets: ["latin"], 
  weight: ["400", "600"], // Apenas os usados
  display: 'swap',
})
```

**Benefícios:**
- Redução de 50-70% no tamanho das fontes
- Melhor FCP
- Menos requisições HTTP

---

### 3. Hydration Mismatch Warning ⚠️ LEVE

**Problema:**
```
A tree hydrated but some attributes of the server rendered HTML 
didn't match the client properties.
```

**Impacto:**
- Pequeno impacto na performance
- Possível flicker visual
- Indica problema de SSR/CSR

**Solução:**
1. Verificar componentes que usam `Date.now()`, `Math.random()`, ou `window`
2. Garantir que dados do servidor sejam serializados corretamente
3. Usar `suppressHydrationWarning` apenas quando necessário

**Exemplo:**
```typescript
// ❌ Ruim
const timestamp = Date.now()

// ✅ Bom
const timestamp = props.serverTimestamp
```

---

## 🎯 Recomendações de Melhoria

### 1. Lazy Loading de Componentes

**Implementar:**
```typescript
// components/image-stylizer.tsx
import dynamic from 'next/dynamic'

// Componentes pesados carregados sob demanda
const ImageStylizer = dynamic(() => import('./image-stylizer'), {
  loading: () => <div>Carregando...</div>,
  ssr: false, // Se não precisa de SSR
})

// Para componentes com formulários complexos
const AdminDashboard = dynamic(() => import('./admin-dashboard'), {
  loading: () => <Skeleton />,
})
```

**Benefícios:**
- Redução do bundle inicial
- Melhor FCP
- Carregamento sob demanda

---

### 2. Prefetch de Rotas Críticas

**Implementar:**
```typescript
// components/app-header.tsx
import Link from 'next/link'

<Link href="/app" prefetch={true}>
  Painel
</Link>

<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>
```

**Benefícios:**
- Navegação mais rápida
- Melhor UX
- Pré-carregamento inteligente

---

### 3. Otimização de Imagens no Componente

**Implementar:**
```typescript
// components/image-stylizer.tsx
import Image from 'next/image'

// ✅ Bom
<Image
  src={previewUrl || "/placeholder.svg"}
  alt="Preview"
  fill
  className="object-contain"
  priority={false} // Lazy load por padrão
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Para imagens acima da dobra
<Image
  src={heroImage}
  alt="Hero"
  fill
  priority={true} // Carregar imediatamente
  sizes="100vw"
/>
```

**Benefícios:**
- Imagens otimizadas automaticamente
- Lazy loading automático
- Responsive images

---

### 4. Compressão e Minificação

**Verificar no servidor:**
- Gzip/Brotli habilitado
- Minificação de CSS/JS em produção
- Tree shaking funcionando

**Next.js já faz isso automaticamente em produção**, mas verificar:
```bash
# Verificar build
pnpm build

# Verificar tamanho dos bundles
pnpm build --analyze
```

---

### 5. Otimização de Queries do Prisma

**Implementar:**
```typescript
// app/(protected)/app/page.tsx
// ✅ Bom - usar select específico
const uploads = await prisma.userUpload.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: "desc" },
  take: pageSize,
  select: {
    id: true,
    url: true,
    prompt: true,
    style: true,
    createdAt: true,
    // Não selecionar campos desnecessários
  },
})

// ❌ Evitar
const uploads = await prisma.userUpload.findMany({
  where: { userId: user.id },
  // Sem select = retorna todos os campos
})
```

**Benefícios:**
- Menos dados transferidos
- Queries mais rápidas
- Menor uso de memória

---

### 6. Cache de Dados Estáticos

**Implementar:**
```typescript
// app/(protected)/app/page.tsx
export const revalidate = 60 // Revalidar a cada 60 segundos

export default async function AppPage() {
  // Dados serão cacheados por 60 segundos
  const uploads = await prisma.userUpload.findMany({
    // ...
  })
}
```

**Para dados que mudam raramente:**
```typescript
export const revalidate = 3600 // 1 hora
```

**Benefícios:**
- Menos queries ao banco
- Respostas mais rápidas
- Menor carga no servidor

---

### 7. Otimização de API Routes

**Implementar:**
```typescript
// app/api/ia/send-image/route.ts
export const runtime = 'nodejs' // ou 'edge' se possível
export const maxDuration = 30 // Timeout máximo

// Usar streaming para respostas longas
export async function POST(request: Request) {
  // ...
}
```

**Para rotas que podem usar Edge:**
```typescript
export const runtime = 'edge'
export const preferredRegion = 'iad1' // Região mais próxima
```

**Benefícios:**
- Respostas mais rápidas
- Melhor distribuição geográfica
- Menor latência

---

### 8. Otimização do Service Worker

**Melhorar cache strategy:**
```javascript
// public/sw.js
const STATIC_CACHE = 'static-v1'
const RUNTIME_CACHE = 'runtime-v1'

// Cache mais agressivo para assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/app',
        '/manifest.webmanifest',
        // Adicionar assets críticos
      ])
    })
  )
})
```

**Benefícios:**
- Melhor experiência offline
- Carregamento mais rápido em visitas subsequentes
- Menor uso de banda

---

### 9. Monitoramento de Performance

**Implementar métricas customizadas:**
```typescript
// lib/performance.ts
export function reportWebVital(metric: any) {
  // Enviar para analytics
  if (metric.name === 'LCP') {
    console.log('LCP:', metric.value)
  }
  if (metric.name === 'FID') {
    console.log('FID:', metric.value)
  }
  if (metric.name === 'CLS') {
    console.log('CLS:', metric.value)
  }
}

// app/layout.tsx
import { reportWebVital } from '@/lib/performance'

export function reportWebVital(metric: any) {
  reportWebVital(metric)
}
```

**Benefícios:**
- Visibilidade de problemas
- Métricas reais de usuários
- Identificação de gargalos

---

### 10. Otimização de Bundle Size

**Analisar bundle:**
```bash
# Instalar analyzer
pnpm add -D @next/bundle-analyzer

# next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Executar
ANALYZE=true pnpm build
```

**Identificar e remover dependências grandes:**
- Verificar imports desnecessários
- Usar tree shaking
- Considerar alternativas mais leves

---

## 📋 Checklist de Implementação

### Prioridade Alta 🔴
- [ ] Habilitar otimização de imagens (`next.config.mjs`)
- [ ] Reduzir pesos de fontes carregados
- [ ] Adicionar `display: 'swap'` nas fontes
- [ ] Corrigir hydration mismatch warnings

### Prioridade Média 🟡
- [ ] Implementar lazy loading de componentes pesados
- [ ] Adicionar prefetch em rotas críticas
- [ ] Otimizar queries do Prisma com `select`
- [ ] Implementar cache com `revalidate`

### Prioridade Baixa 🟢
- [ ] Otimizar Service Worker cache strategy
- [ ] Adicionar métricas customizadas
- [ ] Analisar bundle size
- [ ] Considerar Edge Runtime para APIs

---

## 🧪 Testes de Performance

### Antes e Depois

**Executar testes:**
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Web Vitals
# Já implementado com Vercel Speed Insights
```

### Métricas Alvo

| Métrica | Atual | Meta | Status |
|---------|-------|------|--------|
| TTFB | ~200ms | < 200ms | ✅ |
| FCP | ~400ms | < 1.8s | ✅ |
| LCP | ? | < 2.5s | ⚠️ |
| FID | ? | < 100ms | ⚠️ |
| CLS | ? | < 0.1 | ⚠️ |
| Bundle Size | ? | < 200KB | ⚠️ |

---

## 📚 Recursos Adicionais

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

## 🎯 Conclusão

A aplicação está com **performance boa**, mas há espaço para melhorias significativas:

1. **Crítico**: Habilitar otimização de imagens
2. **Importante**: Reduzir tamanho das fontes
3. **Recomendado**: Implementar lazy loading e cache

Com essas melhorias, espera-se:
- ⬇️ Redução de 30-50% no tamanho das imagens
- ⬇️ Redução de 50-70% no tamanho das fontes
- ⬆️ Melhoria de 20-30% no LCP
- ⬆️ Melhoria geral na experiência do usuário

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0

