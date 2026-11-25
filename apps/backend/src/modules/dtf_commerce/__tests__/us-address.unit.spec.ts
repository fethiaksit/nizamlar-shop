import {
  isValidUsStateCode,
  isValidUsZipCode,
  validateUsShippingAddress,
} from "../us-address"

describe("US State & ZIP Code Validation", () => {
  it("accepts all 50 US states + DC + PR and 5-digit / ZIP+4 postal codes", () => {
    expect(isValidUsStateCode("TX")).toBe(true)
    expect(isValidUsStateCode("ca")).toBe(true)
    expect(isValidUsStateCode("DC")).toBe(true)
    expect(isValidUsStateCode("XX")).toBe(false)

    expect(isValidUsZipCode("90210")).toBe(true)
    expect(isValidUsZipCode("10001-4521")).toBe(true)
    expect(isValidUsZipCode("9021")).toBe(false)
    expect(isValidUsZipCode("ABCDE")).toBe(false)

    expect(
      validateUsShippingAddress({
        address1: "500 Congress Ave",
        city: "Austin",
        stateCode: "TX",
        zipCode: "78701-2410",
        countryCode: "US",
      })
    ).toEqual({ valid: true, errors: [] })

    const invalid = validateUsShippingAddress({
      address1: "",
      city: "Austin",
      stateCode: "INVALID",
      zipCode: "787",
      countryCode: "US",
    })
    expect(invalid.valid).toBe(false)
    expect(invalid.errors).toHaveLength(3)
  })
})
