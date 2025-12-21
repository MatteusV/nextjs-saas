"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function ResetPasswordSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-medium">
            <CheckCircle2 className="h-5 w-5 text-chart-1" />
            Senha atualizada
          </CardTitle>
          <CardDescription>Voce ja pode acessar sua conta com a nova senha.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Se sua conta estiver aberta em outro dispositivo, faca login novamente.
        </CardContent>
        <CardFooter className="border-t border-border/60">
          <Button asChild className="w-full">
            <Link href="/login">Ir para login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
