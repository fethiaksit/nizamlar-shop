import { setDefaultResultOrder } from "node:dns"

// Dedicated disposable container only. Never derive test credentials from the app environment.
export const integrationDatabaseName =
  process.env.TEST_TYPE === "integration:modules"
    ? "nizamlar_dtf_integration_modules"
    : "nizamlar_dtf_integration_http"
export function configureIsolatedDatabase() {
  setDefaultResultOrder("ipv4first")
  const expected = {
    DB_HOST: "localhost",
    DB_PORT: "55434",
    DB_USERNAME: "dtf_test",
    DB_PASSWORD: "dtf_test_only",
  }
  for (const [key, value] of Object.entries(expected)) {
    if (process.env[key] && process.env[key] !== value) {
      throw new Error(
        `Refusing integration tests: ${key} must target the disposable test container`,
      )
    }
    process.env[key] = value
  }
  process.env.DATABASE_URL = `postgres://dtf_test:dtf_test_only@localhost:55434/${integrationDatabaseName}`
  // The runner chooses a free HTTP port; never reuse the development server.
  delete process.env.PORT
  return { DATABASE_URL: process.env.DATABASE_URL }
}
