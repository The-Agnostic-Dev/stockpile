import type { DB } from '../db.ts'
import { shopDate } from '../lib/dates.ts'
import { badRequest, conflict, notFound } from '../lib/http.ts'

export const CATEGORIES = [
  'Medicines',
  'Vitamins & supplements',
  'First aid',
  'Personal care',
  'Baby care',
  'Provisions',
  'Drinks',
] as const

export const PRODUCTS_PAGE_SIZE = 20

export interface Product {
  id: number
  sku: string
  name: string
  category: string
  priceKobo: number
  reorderLevel: number
  stockOnHand: number
}

export interface CounterProduct extends Product {
  sellable: number
}

export interface Batch {
  id: number
  batchNo: string
  expiryDate: string
  qtyReceived: number
  qtyRemaining: number
  costKobo: number
  receivedAt: string
  receivedBy: string | null
  untouched: boolean
}

const PRODUCT_COLUMNS = `p.id, p.sku, p.name, p.category, p.price_kobo AS priceKobo,
  p.reorder_level AS reorderLevel, p.stock_on_hand AS stockOnHand`

export interface ProductQuery {
  q?: string
  category?: string
  offset?: number
}

export function listProducts(db: DB, { q = '', category = '', offset = 0 }: ProductQuery) {
  const where: string[] = []
  const params: Record<string, string | number> = {}
  if (q.trim()) {
    where.push('(p.name LIKE @q OR p.sku LIKE @q)')
    params.q = `%${q.trim()}%`
  }
  if (category) {
    where.push('p.category = @category')
    params.category = category
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM products p ${whereSql}`).get(params) as { n: number }).n
  // One extra row tells us whether there is another page without a second COUNT.
  const rows = db
    .prepare(
      `SELECT ${PRODUCT_COLUMNS} FROM products p ${whereSql}
       ORDER BY p.name COLLATE NOCASE, p.id LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit: PRODUCTS_PAGE_SIZE + 1, offset }) as Product[]
  const hasMore = rows.length > PRODUCTS_PAGE_SIZE
  return {
    items: rows.slice(0, PRODUCTS_PAGE_SIZE),
    total,
    nextOffset: hasMore ? offset + rows.length : null,
  }
}

/** Every product with what can actually be sold today (expired batches excluded). */
export function counterCatalogue(db: DB): CounterProduct[] {
  return db
    .prepare(
      `SELECT ${PRODUCT_COLUMNS},
         COALESCE((SELECT SUM(b.qty_remaining) FROM batches b
                   WHERE b.product_id = p.id AND b.expiry_date >= @today), 0) AS sellable
       FROM products p ORDER BY p.name COLLATE NOCASE`,
    )
    .all({ today: shopDate() }) as CounterProduct[]
}

export function getProduct(db: DB, id: number): Product & { batches: Batch[]; sellable: number } {
  const product = db.prepare(`SELECT ${PRODUCT_COLUMNS} FROM products p WHERE p.id = ?`).get(id) as
    | Product
    | undefined
  if (!product) throw notFound('That product does not exist.')
  const batches = (
    db
      .prepare(
        `SELECT b.id, b.batch_no AS batchNo, b.expiry_date AS expiryDate, b.qty_received AS qtyReceived,
           b.qty_remaining AS qtyRemaining, b.cost_kobo AS costKobo, b.received_at AS receivedAt,
           s.name AS receivedBy,
           NOT EXISTS (SELECT 1 FROM sale_lines l WHERE l.batch_id = b.id)
             AND NOT EXISTS (SELECT 1 FROM adjustments a WHERE a.batch_id = b.id) AS untouched
         FROM batches b LEFT JOIN staff s ON s.id = b.received_by
         WHERE b.product_id = ? ORDER BY b.expiry_date, b.id`,
      )
      .all(id) as (Omit<Batch, 'untouched'> & { untouched: number })[]
  ).map((b) => ({ ...b, untouched: b.untouched === 1 }))
  const today = shopDate()
  const sellable = batches.filter((b) => b.expiryDate >= today).reduce((n, b) => n + b.qtyRemaining, 0)
  return { ...product, batches, sellable }
}

export interface ProductInput {
  sku: string
  name: string
  category: string
  priceKobo: number
  reorderLevel: number
}

export function validateProductInput(body: Record<string, unknown>): ProductInput {
  const sku = String(body.sku ?? '').trim().toUpperCase()
  const name = String(body.name ?? '').trim()
  const category = String(body.category ?? '')
  const priceKobo = body.priceKobo
  const reorderLevel = body.reorderLevel
  if (!sku) throw badRequest('Enter a SKU (the code on the shelf label).')
  if (!name) throw badRequest('Enter the product name.')
  if (!(CATEGORIES as readonly string[]).includes(category)) throw badRequest('Choose a category.')
  if (typeof priceKobo !== 'number' || !Number.isInteger(priceKobo) || priceKobo < 0) {
    throw badRequest('Enter a valid selling price.')
  }
  if (typeof reorderLevel !== 'number' || !Number.isInteger(reorderLevel) || reorderLevel < 0) {
    throw badRequest('Reorder level must be 0 or more.')
  }
  return { sku, name, category, priceKobo, reorderLevel }
}

export function createProduct(db: DB, input: ProductInput): number {
  const clash = db.prepare('SELECT id FROM products WHERE sku = ?').get(input.sku)
  if (clash) throw conflict(`SKU ${input.sku} is already used by another product.`)
  const result = db
    .prepare(
      `INSERT INTO products (sku, name, category, price_kobo, reorder_level, stock_on_hand, created_at)
       VALUES (@sku, @name, @category, @priceKobo, @reorderLevel, 0, @now)`,
    )
    .run({ ...input, now: new Date().toISOString() })
  return Number(result.lastInsertRowid)
}

export function updateProduct(db: DB, id: number, input: ProductInput) {
  getProduct(db, id)
  const clash = db.prepare('SELECT id FROM products WHERE sku = ? AND id <> ?').get(input.sku, id)
  if (clash) throw conflict(`SKU ${input.sku} is already used by another product.`)
  db.prepare(
    `UPDATE products SET sku = @sku, name = @name, category = @category,
       price_kobo = @priceKobo, reorder_level = @reorderLevel WHERE id = @id`,
  ).run({ ...input, id })
}
