import crypto from "crypto"

// Generate a secure API key
export function generateApiKey(): string {
  return "sk_" + crypto.randomBytes(32).toString("hex")
}

// Generate a unique subscription code
export function generateSubscriptionCode(): string {
  const prefix = "SUB"
  const part1 = crypto.randomBytes(3).toString("hex").toUpperCase()
  const part2 = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `${prefix}_${part1}_${part2}`
}

// Calculate subscription end date
export function calculateEndDate(startDate: Date, durationDays: number): Date {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + durationDays)
  return endDate
}

// Check if subscription is expired
export function isSubscriptionExpired(endDate: string): boolean {
  return new Date(endDate) < new Date()
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// Format duration
export function formatDuration(days: number): string {
  if (days === 30) return "1 Month"
  if (days === 365) return "1 Year"
  if (days < 30) return `${days} Days`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months} Month${months > 1 ? "s" : ""}`
  }
  const years = Math.floor(days / 365)
  return `${years} Year${years > 1 ? "s" : ""}`
}
