# AI Stylizer

SaaS para personalizar fotos com IA, gerenciar planos via Stripe e armazenar imagens por plano.

## Principais features

- Login/registro com verificação de email e redefinição de senha.
- Geração de imagens com IA (AI Gateway) a partir de imagem + prompt/estilo.
- Planos Free/Pro/Business com limites e benefícios no banco.
- Billing Stripe (checkout, portal, cancelamento e webhook).
- Área `/app` com criação de imagens e, para planos com storage, histórico.
- Dashboard admin (`/dashboard`) com métricas, preços, benefícios e promoções.
- PWA com service worker e banner de instalação.

## Setup rápido

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

## Variáveis de ambiente

Veja `.env.example`. Campos principais:

- `DATABASE_URL`
- `JWT_SECRET`
- `STRIPE_SECRET`, `STRIPE_PUBLIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`
- `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `STRIPE_WEBHOOK_SECRET`
- `AI_GATEWAY_API_KEY`

## Stripe (dev)

Use a Stripe CLI para webhooks em localhost:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## PWA

- Manifest em `app/manifest.ts`.
- Service worker em `public/sw.js`.
- Banner de instalação e dica iOS em `components/pwa-install-banner.tsx` e `components/pwa-ios-tip.tsx`.

## Notas

- O Prisma Client é gerado em `generated/prisma/client`. Garanta `pnpm prisma generate` antes do build na Vercel.
- Benefícios e limites dos planos vêm do banco (`Plan.benefits`, `Plan.stylizeLimit`).
- `Plan.hasImageStorage` controla se as imagens são salvas no Blob e se a aba "Minhas imagens" aparece.
