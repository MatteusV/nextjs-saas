type SubscriptionPlan = "FREE_TIER" | "PRO" | "BUSINESS"

export function canUseIntegrations(plan?: SubscriptionPlan | null) {
  return plan === "PRO" || plan === "BUSINESS"
}

