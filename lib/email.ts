type SendVerificationEmailResult = {
  sent: boolean
  providerId?: string
}

type SendVerificationEmailParams = {
  to: string
  name: string
  verificationUrl: string
}

const RESEND_ENDPOINT = "https://api.resend.com/emails"

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: SendVerificationEmailParams): Promise<SendVerificationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    console.warn("Email not sent: RESEND_API_KEY or EMAIL_FROM missing")
    return { sent: false }
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Confirme seu email</h2>
      <p>Ola ${name},</p>
      <p>Para ativar sua conta, clique no link abaixo:</p>
      <p><a href="${verificationUrl}">Verificar minha conta</a></p>
      <p>Se voce nao criou esta conta, ignore este email.</p>
    </div>
  `

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Verifique sua conta",
      html,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    console.warn("Email not sent: provider error", errorBody)
    return { sent: false }
  }

  const data = (await response.json().catch(() => null)) as { id?: string } | null
  return { sent: true, providerId: data?.id }
}
