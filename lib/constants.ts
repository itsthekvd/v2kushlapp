// Centralized constants for KushL app

// Task Categories
export const TASK_CATEGORIES = [
  "Website Development",
  "Video Editing",
  "Software Development",
  "Search Engine Optimization",
  "Architecture & Interior Design",
  "Book Design",
  "User Generated Content",
  "Voice Over",
  "Social Media Marketing",
  "AI Development",
  "Logo Design",
  "Graphics & Design",
  "Digital Marketing",
  "Writing & Translation",
  "Animation",
  "Music & Audio",
  "Programming & Tech",
  "Business Consulting",
  "Data Analysis",
  "Photography",
  "Finance",
  "Legal Services",
]

// Platform Charges
export interface PlatformChargesTier {
  minAmount: number
  maxAmount: number
  commissionPercentage: number
}

export const PLATFORM_CHARGES_TIERS: PlatformChargesTier[] = [
  { minAmount: 0, maxAmount: 999, commissionPercentage: 15 },
  { minAmount: 1000, maxAmount: 4999, commissionPercentage: 10 },
  { minAmount: 5000, maxAmount: 9999, commissionPercentage: 7 },
  { minAmount: 10000, maxAmount: 49999, commissionPercentage: 5 },
  { minAmount: 50000, maxAmount: 100000, commissionPercentage: 3 },
]

// Currency
export const CURRENCY = "₹"

// Helper functions for pricing calculations
export const calculatePlatformCommission = (amount: number): number => {
  const tier =
    PLATFORM_CHARGES_TIERS.find((tier) => amount >= tier.minAmount && amount <= tier.maxAmount) ||
    PLATFORM_CHARGES_TIERS[PLATFORM_CHARGES_TIERS.length - 1]

  return Math.round((amount * tier.commissionPercentage) / 100)
}

export const calculateStudentEarnings = (amount: number): number => {
  const commission = calculatePlatformCommission(amount)
  return amount - commission
}

export const getCommissionPercentage = (amount: number): number => {
  const tier =
    PLATFORM_CHARGES_TIERS.find((tier) => amount >= tier.minAmount && amount <= tier.maxAmount) ||
    PLATFORM_CHARGES_TIERS[PLATFORM_CHARGES_TIERS.length - 1]

  return tier.commissionPercentage
}

// Format price with currency symbol
export const formatPrice = (amount: number): string => {
  return `${CURRENCY}${amount.toLocaleString("en-IN")}`
}
