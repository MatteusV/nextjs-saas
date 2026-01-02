const GRAPH_VERSION = "v24.0"
const FACEBOOK_OAUTH_BASE = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`
const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

type FacebookTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

type FacebookPageResponse = {
  data: Array<{
    id: string
    name: string
    access_token: string
    instagram_business_account?: {
      id: string
    }
  }>
}

type InstagramProfileResponse = {
  id: string
  username?: string
  profile_picture_url?: string
}

type InstagramMediaResponse = {
  id: string
}

type InstagramPublishResponse = {
  id: string
}

type InstagramMediaListResponse = {
  data: Array<{
    id: string
    caption?: string
    media_type?: string
    media_url?: string
    thumbnail_url?: string
    timestamp?: string
    permalink?: string
  }>
}

type InstagramInsightsResponse = {
  data: Array<{
    name: string
    period: string
    values: Array<{ value: number }>
    title?: string
    description?: string
  }>
}

export function getInstagramConfig() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI
  const pageId = process.env.INSTAGRAM_PAGE_ID
  const igUserId = process.env.INSTAGRAM_IG_USER_ID

  if (!clientId || !clientSecret || !redirectUri) {
    return null
  }

  return { clientId, clientSecret, redirectUri, pageId, igUserId }
}

export function buildInstagramAuthUrl(state: string) {
  const config = getInstagramConfig()
  if (!config) {
    return null
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: [
      "pages_show_list",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
    ].join(","),
    response_type: "code",
    state,
  })

  return `${FACEBOOK_OAUTH_BASE}?${params.toString()}`
}

export async function exchangeInstagramCodeForToken(code: string) {
  const config = getInstagramConfig()
  if (!config) {
    throw new Error("Instagram not configured")
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/oauth/access_token?${params.toString()}`)

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Falha ao trocar o code do Instagram: ${response.status} ${detail}`)
  }

  return (await response.json()) as FacebookTokenResponse
}

export async function exchangeInstagramLongLivedToken(accessToken: string) {
  const config = getInstagramConfig()
  if (!config) {
    throw new Error("Instagram not configured")
  }

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    fb_exchange_token: accessToken,
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/oauth/access_token?${params.toString()}`)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Falha ao obter token longo do Instagram: ${response.status} ${detail}`)
  }

  return (await response.json()) as FacebookTokenResponse
}

export async function fetchFacebookPages(accessToken: string) {
  const params = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account",
    access_token: accessToken,
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/me/accounts?${params.toString()}`)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Falha ao obter páginas do Facebook: ${response.status} ${detail}`)
  }

  const data = (await response.json()) as FacebookPageResponse
  return data.data
}

export function pickInstagramBusinessPage(pages: FacebookPageResponse["data"]) {
  return pages.find((page) => page.instagram_business_account?.id)
}

export async function fetchFacebookPageById(accessToken: string, pageId: string) {
  const params = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account",
    access_token: accessToken,
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/${pageId}?${params.toString()}`)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Falha ao obter página do Facebook: ${response.status} ${detail}`)
  }

  return (await response.json()) as FacebookPageResponse["data"][number]
}

export async function fetchInstagramProfile(accessToken: string, igUserId: string) {
  const params = new URLSearchParams({
    fields: "id,username,profile_picture_url",
    access_token: accessToken,
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/${igUserId}?${params.toString()}`)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Falha ao obter perfil do Instagram: ${response.status} ${detail}`)
  }

  return (await response.json()) as InstagramProfileResponse
}

export async function createInstagramMediaContainer({
  igUserId,
  accessToken,
  imageUrl,
  caption,
}: {
  igUserId: string
  accessToken: string
  imageUrl: string
  caption?: string
}) {
  const body = new URLSearchParams({
    image_url: imageUrl,
    access_token: accessToken,
  })

  if (caption) {
    body.set("caption", caption)
  }

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/${igUserId}/media`, {
    method: "POST",
    body,
  })

  if (!response.ok) {
    throw new Error("Falha ao criar mídia no Instagram")
  }

  return (await response.json()) as InstagramMediaResponse
}

export async function publishInstagramMedia({
  igUserId,
  accessToken,
  creationId,
}: {
  igUserId: string
  accessToken: string
  creationId: string
}) {
  const body = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    body,
  })

  if (!response.ok) {
    throw new Error("Falha ao publicar mídia no Instagram")
  }

  return (await response.json()) as InstagramPublishResponse
}

export async function fetchInstagramMediaList({
  igUserId,
  accessToken,
  limit = 12,
}: {
  igUserId: string
  accessToken: string
  limit?: number
}) {
  const params = new URLSearchParams({
    fields: "id,caption,media_type,media_url,thumbnail_url,timestamp,permalink",
    access_token: accessToken,
    limit: String(limit),
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/${igUserId}/media?${params.toString()}`)
  if (!response.ok) {
    throw new Error("Falha ao carregar mídias do Instagram")
  }

  return (await response.json()) as InstagramMediaListResponse
}

export function getInsightsMetricsByType(mediaType?: string | null) {
  const normalized = mediaType?.toUpperCase()

  if (normalized === "REELS") {
    return ["plays", "reach", "saved", "shares", "likes", "comments"]
  }

  if (normalized === "VIDEO") {
    return ["video_views", "reach", "saved", "shares", "likes", "comments"]
  }

  if (normalized === "STORY") {
    return ["reach", "replies"]
  }

  return ["reach", "saved", "likes", "comments", "shares"]
}

export async function fetchInstagramInsights({
  mediaId,
  accessToken,
  mediaType,
}: {
  mediaId: string
  accessToken: string
  mediaType?: string | null
}) {
  const metrics = getInsightsMetricsByType(mediaType).join(",")
  const params = new URLSearchParams({
    metric: metrics,
    access_token: accessToken,
  })

  const response = await fetch(`${FACEBOOK_GRAPH_BASE}/${mediaId}/insights?${params.toString()}`)
  if (!response.ok) {
    const detail = await response.text()
    const parsed = (() => {
      try {
        return JSON.parse(detail)
      } catch {
        return null
      }
    })()
    const userMessage =
      parsed?.error?.error_user_msg ||
      parsed?.error?.message ||
      "Não foi possível carregar os insights agora."
    throw new Error(userMessage)
  }

  return (await response.json()) as InstagramInsightsResponse
}
