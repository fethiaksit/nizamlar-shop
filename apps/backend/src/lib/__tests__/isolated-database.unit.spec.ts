import {
  configureIsolatedDatabase,
  integrationDatabaseName,
} from "../../../integration-tests/helpers/isolated-database"

const keys = [
  "DB_HOST",
  "DB_PORT",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DATABASE_URL",
  "PORT",
] as const

describe("integration database isolation guard", () => {
  let original: Record<string, string | undefined>

  beforeEach(() => {
    original = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
    for (const key of keys) delete process.env[key]
  })

  afterEach(() => {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key]
      else process.env[key] = original[key]
    }
  })

  it("always redirects the app connection to the dedicated disposable database", () => {
    process.env.DATABASE_URL =
      "postgres://unused@localhost:5434/not-a-test-database"
    const result = configureIsolatedDatabase()
    const url = new URL(result.DATABASE_URL)
    expect(url.hostname).toBe("localhost")
    expect(url.port).toBe("55434")
    expect(url.pathname).toBe(`/${integrationDatabaseName}`)
    expect(integrationDatabaseName).toMatch(
      /^nizamlar_dtf_integration_(http|modules)$/,
    )
    expect(url.pathname).not.toContain("nizamlar_shop")
  })

  it.each(["DB_HOST", "DB_PORT", "DB_USERNAME", "DB_PASSWORD"])(
    "rejects an unexpected %s before changing the app connection",
    (key) => {
      process.env[key] = "unsafe-value"
      process.env.DATABASE_URL = "unchanged-sentinel"
      expect(() => configureIsolatedDatabase()).toThrow(
        "Refusing integration tests",
      )
      expect(process.env.DATABASE_URL).toBe("unchanged-sentinel")
    },
  )
})
