"use client"

import { FeaturesStepper } from "@/components/features-stepper"

type FeaturesStepperClientProps = {
  features: Parameters<typeof FeaturesStepper>[0]["features"]
}

export function FeaturesStepperClient({ features }: FeaturesStepperClientProps) {
  return <FeaturesStepper features={features} />
}
