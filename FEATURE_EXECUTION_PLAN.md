# Plano de Execucao - Features do SAAS

Objetivo: adicionar valor percebido ao usuario final com entregas incrementais, mantendo a base tecnica limpa e escalavel.

## Sessao 1 - Core (geracao e qualidade)

### Meta
Aumentar qualidade do resultado e velocidade de iteracao para o usuario final, mantendo o fluxo atual simples.

### Features e UX (componente e comportamento)

1) Variacoes rapidas (3-4 opcoes por geracao)
- UI: bloco "Variacoes" abaixo do resultado, com grid 2x2 no desktop e 1 coluna no mobile.
- Componentes: Card, Button, Badge, Skeleton (carregamento).
- Regras de UX: carregamento com placeholders; CTA "Gerar variacoes" aparece apenas apos a primeira imagem.
- Backend: endpoint gera N imagens com mesmo prompt base + seed variado.
- Persistencia: salvar todas as variacoes como parte da mesma geracao (relacao 1:N).

2) Antes e depois (slider comparativo)
- UI: componente de comparacao com handle central; toggle para "Antes/Depois".
- Componentes: Card, Button, Slider custom simples (sem lib nova).
- Regras de UX: foco no resultado, slider ocupa largura total no mobile.
- Backend: nenhuma; usa imagem original + resultado.

3) Reaplicar estilo (preset salvo)
- UI: botao "Salvar preset" no resultado; lista de presets no painel de criacao.
- Componentes: Card, Button, Input, Label, Badge.
- Regras de UX: salvamento com nome e tags; presets com atalho "Aplicar".
- Backend: CRUD de presets por usuario.
- Persistencia: tabela Preset (nome, estilo, prompt base, tags, createdAt).

4) Guided prompt (campos guiados)
- UI: formulario com campos curtos (Estilo, Emocao, Iluminacao, Paleta, Detalhes).
- Componentes: Input, Label, Select (se ja existir), Badge.
- Regras de UX: cada campo opcional, preview do prompt final em tempo real.
- Backend: combinar campos em um prompt tecnico unico (server-side).
- Persistencia: armazenar o prompt normalizado e o prompt final.

5) Crop inteligente (avatar, story, post, wallpaper)
- UI: botoes de formato com preview (1:1, 9:16, 16:9, 4:5).
- Componentes: Button, Badge.
- Regras de UX: lembrar ultimo formato usado por usuario.
- Backend: gerar variantes de recorte usando imagem final.
- Persistencia: salvar arquivos derivados quando o plano permitir storage.

### Regras de UI/UX (ui-ux-rules.md)
- Usar apenas tokens semanticos (bg-background, text-foreground, border-border).
- Cards com shadow-xl e border-border/50 quando destaque.
- Tipografia: H2/H3 com text-balance, body com text-base.
- Estados de loading com Loader2 e skeletons.
- Acessibilidade: labels em inputs, aria-label em botoes de icone.

### Regras de implementacao
- Nenhuma logica pesada em componentes React.
- Geracao sempre via rota/Server Action.
- Logs server-side com contexto (userId, plano, requestId).
- Respeitar limites de uso por plano.
- Sem novas dependencias a menos que seja obrigatorio.

### Entregaveis tecnicos
- Componentes novos: Comparador de imagem, Variacoes grid, Presets panel, Guided prompt panel, Crop actions.
- API/Server Actions: gerar variacoes, salvar preset, listar presets, aplicar preset.
- Atualizacao do fluxo principal para suportar geracoes multipla.

### Dependencias
- Modelos de dados: presets, variantes de geracao, metadados de crop.
- Storage configurado (para planos com storage).

### Criterio de aceite
- Usuario gera, compara e exporta em ate 3 cliques.
- Presets reutilizaveis entre sessoes.
- Fluxo responde rapido com loading claro e sem travar o UI.

## Sessao 2 - Organizacao e retencao

### Meta
Facilitar revisita e organizacao do historico.

### Features
- Colecoes/Projetos.
- Tags e filtros.
- Favoritos.
- Historico por linha do tempo.

### Regras
- Paginar no backend.
- Historico sempre ordenado por data desc.
- Filtros combinaveis (tag, estilo, data).

### Entregaveis
- CRUD de colecoes.
- UI de tags + filtros.
- Favoritos e timeline.

### Dependencias
- Tabelas para colecoes, tags e relacionamento.

### Criterio de aceite
- Usuario encontra qualquer imagem em ate 10s.

## Sessao 3 - Monetizacao

### Meta
Aumentar ARPU e reduzir churn.

### Features
- Creditos adicionais (pacotes avulsos).
- Upgrade ao atingir limite.
- Watermark leve no Free (opcional).
- Limites dinamicos por plano (vindo do banco/Stripe).

### Plano detalhado (o que implementar)
1) Creditos adicionais (pacotes avulsos)
- Dados: adicionar saldo de creditos no usuario + tabela de compras (CreditPurchase).
- Stripe: checkout em modo `payment` com metadata (userId, credits).
- Webhook: ao finalizar o checkout, registrar compra e incrementar creditos do usuario.
- UX: card no perfil com saldo atual + botao "Comprar creditos".

2) Upgrade ao atingir limite
- Servidor: checar limite antes de gerar (inclui variacoes).
- Resposta: retornar erro com code `LIMIT_REACHED` + CTA para `/app/plans`.
- UI: mostrar aviso e botao de upgrade/compra de creditos.

3) Watermark leve no Free
- Plano: flag `watermarkEnabled` e texto configuravel.
- Servidor: aplicar watermark no output somente quando plano permitir.
- UX: nao bloquear download; watermark discreto no canto.

4) Limites dinamicos por plano
- Fonte: plan.stylizeLimit no banco; precos sempre consultados na Stripe.
- Consumo: reset mensal no servidor, uso do saldo de creditos quando limite esgotar.
- Perfil: mostrar limite atual e creditos extras disponiveis.

### Regras
- Limites sempre checados no servidor.
- Cobranças com Stripe, sem hardcode de preco.
- Historico financeiro visivel para o usuario.

### Entregaveis
- Fluxo de compra de creditos.
- Tela de upgrade contextual.
- Watermark configuravel via plano.

### Dependencias
- Stripe price lookup.
- Colunas de limites por plano.

### Criterio de aceite
- Usuario consegue comprar extra em menos de 60s.

## Sessao 4 - Social e compartilhamento

### Meta
Aumentar viralidade e utilidade externa.

### Features
- Export com legenda sugerida.
- Templates para redes sociais.
- Compartilhar link direto da imagem.

### Regras
- Export em tamanhos padrao.
- Link expira (opcional) e respeita plano.

### Entregaveis
- UI de export e copy.
- Endpoint de legenda sugerida.

### Dependencias
- Storage publico com controle de acesso.

### Criterio de aceite
- Usuario publica em rede social em 2 cliques.

## Sessao 5 - Integracoes (fase 2)

### Meta
Automatizar publicacao e fluxo externo.

### Features
- Instagram (conectar conta e preparar exportações).
- Canva (export com template).
- Google Drive/Dropbox (backup).
- Zapier/Make (automacoes).

### Regras
- OAuth claro e isolado por provedor.
- Permissoes minimas.

### Entregaveis
- Conectar/desconectar integracoes.
- Logs de jobs.

### Dependencias
- Tokens criptografados.
- Jobs assinc e filas.

### Criterio de aceite
- Integracoes funcionam sem suporte manual.

## Sessao 6 - Admin e insights

### Meta
Dar controle ao admin e visibilidade operacional.

### Features
- Dashboard de uso por plano.
- Taxa de conversao e churn.
- Alertas de custo por modelo.
- Painel de comunicados.

### Regras
- Somente ADMIN.
- Dados agregados e anonimizados.

### Entregaveis
- KPIs principais e alertas.
- Export CSV.

### Dependencias
- Eventos registrados no backend.

### Criterio de aceite
- Admin identifica gargalos em 5 min.

## Plano de Execucao (fases)

### Fase 1 - Core (2-3 sprints)
1. Variacoes rapidas + UI.
2. Antes/depois + slider.
3. Presets e reaplicar.
4. Guided prompt e export.

### Fase 2 - Organizacao (1-2 sprints)
1. Colecoes + tags.
2. Favoritos + filtros.
3. Timeline.

### Fase 3 - Monetizacao (1 sprint)
1. Creditos extras.
2. Upgrade contextual.
3. Watermark no Free.

### Fase 4 - Social (1 sprint)
1. Export + legenda.
2. Compartilhamento.

### Fase 5 - Integracoes (2-4 sprints)
1. Instagram.
2. Canva.
3. Drive/Dropbox.
4. Zapier/Make.

### Fase 6 - Admin (1 sprint)
1. KPIs + alertas.
2. Export e logs.

## Notas
- Cada fase deve manter compatibilidade com o fluxo atual.
- Sempre medir custo por request e ajustar limites.
- Feature flags recomendadas para rollout gradual.
