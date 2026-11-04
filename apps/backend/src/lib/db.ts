import { Pool } from "pg"

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"

export const pgPool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
})

export async function queryDb<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pgPool.connect()
  try {
    const res = await client.query(text, params)
    return res.rows
  } finally {
    client.release()
  }
}
