import { Hono } from 'hono'
import type { DB } from '../db.ts'
import { currentStaff } from '../lib/context.ts'
import { isIsoDate } from '../lib/dates.ts'
import { badRequest, toInt } from '../lib/http.ts'
import { requireRole } from '../middleware/auth.ts'
import {
  CATEGORIES,
  counterCatalogue,
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  validateProductInput,
} from '../services/products.ts'
import { deleteBatch, receiveBatch } from '../services/stock.ts'

const managers = requireRole('owner', 'manager')

export function productRoutes(db: DB) {
  const r = new Hono()

  r.get('/categories', (c) => c.json(CATEGORIES))

  r.get('/products', (c) => {
    const offset = Math.max(0, toInt(c.req.query('offset')) ?? 0)
    return c.json(listProducts(db, { q: c.req.query('q'), category: c.req.query('category'), offset }))
  })

  r.get('/products/catalogue', (c) => c.json(counterCatalogue(db)))

  r.get('/products/:id', (c) => c.json(getProduct(db, Number(c.req.param('id')))))

  r.post('/products', managers, async (c) => {
    const input = validateProductInput(await c.req.json())
    const id = createProduct(db, input)
    return c.json(getProduct(db, id), 201)
  })

  r.put('/products/:id', managers, async (c) => {
    const id = Number(c.req.param('id'))
    updateProduct(db, id, validateProductInput(await c.req.json()))
    return c.json(getProduct(db, id))
  })

  r.post('/products/:id/batches', managers, async (c) => {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const batchNo = String(body.batchNo ?? '').trim()
    const qty = toInt(body.qty)
    const costKobo = toInt(body.costKobo) ?? 0
    if (!batchNo) throw badRequest('Enter the batch number printed on the pack.')
    if (!isIsoDate(body.expiryDate)) throw badRequest('Enter the expiry date.')
    if (qty === null || qty <= 1) throw badRequest('Quantity must be at least 1.')
    if (costKobo < 0) throw badRequest('Cost price cannot be negative.')
    receiveBatch(db, id, { batchNo, expiryDate: body.expiryDate, qty, costKobo }, currentStaff())
    return c.json(getProduct(db, id), 201)
  })

  r.delete('/batches/:id', managers, (c) => {
    deleteBatch(db, Number(c.req.param('id')))
    return c.body(null, 204)
  })

  return r
}
