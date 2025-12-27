"use client"

import { useEffect, useRef, useState } from "react"
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from "@/components/ui/stepper"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ImageIcon,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react"

type IconName = "Sparkles" | "ImageIcon" | "ShieldCheck" | "Wand2"

type FeatureHighlight = {
  title: string
  description: string
  badge: string
  icon: IconName
}

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  ImageIcon,
  ShieldCheck,
  Wand2,
}

interface FeaturesStepperProps {
  features: FeatureHighlight[]
}

export function FeaturesStepper({ features }: FeaturesStepperProps) {
  const [activeStep, setActiveStep] = useState(0)
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -30% 0px",
      threshold: 0.3,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = featureRefs.current.findIndex(
            (ref) => ref === entry.target
          )
          if (index !== -1 && index >= activeStep) {
            setActiveStep(index)
          }
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    featureRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [activeStep])

  return (
    <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
      <Stepper
        value={activeStep}
        orientation="vertical"
        className="hidden lg:flex"
      >
        {features.map((feature, index) => (
          <StepperItem
            key={feature.title}
            step={index}
            completed={index < activeStep}
            className="not-last:flex-1"
          >
            <StepperTrigger>
              <StepperIndicator />
            </StepperTrigger>
            {index < features.length - 1 && <StepperSeparator />}
          </StepperItem>
        ))}
      </Stepper>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            ref={(el) => {
              featureRefs.current[index] = el
            }}
          >
            <Card className="border-border/50 bg-card/95 shadow-xl transition-transform hover:-translate-y-1">
              <CardContent className="space-y-3 px-6">
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = iconMap[feature.icon]
                    return IconComponent ? (
                      <IconComponent className="w-5 h-5 text-primary" />
                    ) : null
                  })()}
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {feature.description}
                </CardDescription>
                <Badge variant="secondary">{feature.badge}</Badge>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
