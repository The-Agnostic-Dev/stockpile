import { Hono } from 'hono'
import type { DB } from './db.ts'
import { handleError } from './lib/http.ts'
import { requireStaff } from './middleware/auth.ts'
import { authRoutes } from './routes/auth.ts'
import { productRoutes } from './routes/products.ts'
import { salesRoutes } from './routes/sales.ts'
import { stockRoutes } from './routes/stock.ts'

export function createApi(db: DB) {
  const api = new Hono()
  api.get('/health', (c) => c.json({ ok: true }))
  api.route('/', authRoutes(db))
  api.use('*', requireStaff)
  api.route('/', productRoutes(db))
  api.route('/', salesRoutes(db))
  api.route('/', stockRoutes(db))
  api.notFound((c) => c.json({ error: 'Not found.' }, 404))
  api.onError(handleError)
  return api
}
