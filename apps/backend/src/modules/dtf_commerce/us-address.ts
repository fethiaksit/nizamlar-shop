export interface UsStateOption {
  code: string
  name: string
}

export const US_STATES_AND_TERRITORIES: readonly UsStateOption[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "PR", name: "Puerto Rico" },
] as const

const VALID_US_STATE_CODES = new Set(
  US_STATES_AND_TERRITORIES.map((s) => s.code)
)

const US_ZIP_REGEX = /^\d{5}(-\d{4})?$/

export function isValidUsStateCode(code: string): boolean {
  return VALID_US_STATE_CODES.has(String(code || "").trim().toUpperCase())
}

export function isValidUsZipCode(zip: string): boolean {
  return US_ZIP_REGEX.test(String(zip || "").trim())
}

export function validateUsShippingAddress(input: {
  address1: string
  city: string
  stateCode: string
  zipCode: string
  countryCode: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (String(input.countryCode || "").trim().toUpperCase() !== "US") {
    errors.push("Country code must be US")
  }
  if (String(input.address1 || "").trim().length < 3) {
    errors.push("Street address is required")
  }
  if (String(input.city || "").trim().length < 2) {
    errors.push("City is required")
  }
  if (!isValidUsStateCode(input.stateCode)) {
    errors.push("Valid 2-letter US state or territory code is required")
  }
  if (!isValidUsZipCode(input.zipCode)) {
    errors.push("Valid 5-digit or ZIP+4 US postal code is required (e.g. 75001 or 75001-1234)")
  }
  return {
    valid: errors.length === 0,
    errors,
  }
}
