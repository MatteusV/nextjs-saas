import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/server-actions/session"
import { prisma } from "@/lib/prisma"
import {
  exchangeInstagramCodeForToken,
  exchangeInstagramLongLivedToken,
  fetchFacebookPageById,
  fetchFacebookPages,
  fetchInstagramProfile,
  getInstagramConfig,
  pickInstagramBusinessPage,
} from "@/server-actions/integrations/instagram"
import { createIntegrationJob } from "@/server-actions/integrations/jobs"
import { canUseIntegrations } from "@/utils/integrations"

export async function GET(request: Request) {
  const user = await getSessionUser()
  const origin = new URL(request.url).origin
  const redirectTarget = new URL("/app/integrations", origin)

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin))
  }

  if (!canUseIntegrations(user.subscriptionPlan)) {
    redirectTarget.pathname = "/app/plans"
    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "CONNECT",
      status: "FAILED",
      error: "Acesso restrito ao plano Pro ou Business",
    })
    return NextResponse.redirect(redirectTarget)
  }

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  const cookieStore = await cookies()
  const storedState = cookieStore.get("ig_oauth_state")?.value
  cookieStore.delete("ig_oauth_state")

  if (error) {
    redirectTarget.searchParams.set("error", error)
    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "CONNECT",
      status: "FAILED",
      error,
    })
    return NextResponse.redirect(redirectTarget)
  }

  if (!code || !state || !storedState || storedState !== state) {
    redirectTarget.searchParams.set("error", "invalid_state")
    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "CONNECT",
      status: "FAILED",
      error: "invalid_state",
    })
    return NextResponse.redirect(redirectTarget)
  }

  try {
    const config = getInstagramConfig()
    const token = await exchangeInstagramCodeForToken(code)
    const longToken = await exchangeInstagramLongLivedToken(token.access_token)
    let page = null

    if (config?.pageId) {
      page = await fetchFacebookPageById(longToken.access_token, config.pageId)
    } else {
      const pages = await fetchFacebookPages(longToken.access_token)
      page = pickInstagramBusinessPage(pages)
    }

    const igUserId = page?.instagram_business_account?.id ?? config?.igUserId

    if (!igUserId) {
      throw new Error("Nenhuma página com Instagram Business vinculada")
    }
    const profile = await fetchInstagramProfile(page.access_token, igUserId)

    const expiresAt = new Date(Date.now() + longToken.expires_in * 1000)

    await prisma.integrationAccount.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "INSTAGRAM",
        },
      },
      update: {
        providerAccountId: igUserId,
        username: profile.username ?? null,
        accessToken: page.access_token,
        expiresAt,
        pageId: page.id,
        pageName: page.name,
      },
      create: {
        userId: user.id,
        provider: "INSTAGRAM",
        providerAccountId: igUserId,
        username: profile.username ?? null,
        accessToken: page.access_token,
        expiresAt,
        pageId: page.id,
        pageName: page.name,
      },
    })

    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "CONNECT",
      status: "SUCCESS",
      metadata: {
        username: profile.username ?? null,
        pageName: page.name,
        pageId: page.id,
        igUserId,
      },
    })

    redirectTarget.searchParams.set("connected", "instagram")
    return NextResponse.redirect(redirectTarget)
  } catch (err) {
    console.error("[instagram] token_exchange failed", err)
    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "CONNECT",
      status: "FAILED",
      error: err instanceof Error ? err.message : "unknown_error",
    })
    redirectTarget.searchParams.set("error", "token_exchange")
    return NextResponse.redirect(redirectTarget)
  }
}
