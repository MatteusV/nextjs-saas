import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"
import { EmailChangeContent } from "@/components/email-change-content"

function EmailChangeFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-medium">
            <MailCheck className="h-5 w-5 text-primary" />
            Confirmação de email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Validando seu link...
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmailChangePage() {
  return (
    <Suspense fallback={<EmailChangeFallback />}>
      <EmailChangeContent />
    </Suspense>
  )
}
