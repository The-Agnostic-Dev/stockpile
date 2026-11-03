import type { DB } from '../db.ts'
import { shopDayRange } from '../lib/dates.ts'
import { badRequest, conflict, notFound } from '../lib/http.ts'
import { allocate } from './stock.ts'
import type { Staff } from './staff.ts'

export const PAYMENT_METHODS = ['cash', 'transfer', 'pos'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface SaleRequest {
  paymentMethod: PaymentMethod
  lines: { productId: number; qty: number }[]
}

export function parseSaleRequest(body: unknown): SaleRequest {
  const raw = (body ?? {}) as Record<string, unknown>
  const paymentMethod = raw.paymentMethod as PaymentMethod
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw badRequest('Choose how the customer paid.')
  if (!Array.isArray(raw.lines) || raw.lines.length === 0) throw badRequest('The cart is empty.')
  const merged = new Map<number, number>()
  for (const line of raw.lines as Record<string, unknown>[]) {
    const productId = Number(line?.productId)
    const qty = Number(line?.qty)
    if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty < 1) {
      throw badRequest('Every item needs a quantity of at least 1.')
    }
    merged.set(productId, (merged.get(productId) ?? 0) + qty)
  }
  return { paymentMethod, lines: [...merged].map(([productId, qty]) => ({ productId, qty })) }
}

export function receiptNo(id: number) {
  return 'R-' + String(id).padStart(6, '0')
}

export function createSale(db: DB, request: SaleRequest, cashier: Staff): number {
  return db.transaction(() => {
    const now = new Date().toISOString()
    const sale = db
      .prepare('INSERT INTO sales (created_at, cashier_id, payment_method, total_kobo) VALUES (?, ?, ?, 0)')
      .run(now, cashier.id, request.paymentMethod)
    const saleId = Number(sale.lastInsertRowid)
    const insertLine = db.prepare(
      `INSERT INTO sale_lines (sale_id, product_id, batch_id, qty, unit_price_kobo, line_total_kobo)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    let total = 0
    for (const line of request.lines) {
      const product = db.prepare('SELECT name, price_kobo FROM products WHERE id = ?').get(line.productId) as
        | { name: string; price_kobo: number }
        | undefined
      if (!product) throw badRequest('One of the items is no longer in the catalogue.')
      const picks = allocate(db, line.productId, line.qty)
      if (picks.length === 0) throw conflict(`Not enough ${product.name} in stock.`)
      for (const pick of picks) {
        insertLine.run(saleId, line.productId, pick.batchId, pick.qty, product.price_kobo, pick.qty * product.price_kobo)
        db.prepare('UPDATE batches SET qty_remaining = qty_remaining - ? WHERE id = ?').run(pick.qty, pick.batchId)
      }
      db.prepare('UPDATE products SET stock_on_hand = stock_on_hand - ? WHERE id = ?').run(line.qty, line.productId)
      total += line.qty * product.price_kobo
    }
    db.prepare('UPDATE sales SET total_kobo = ? WHERE id = ?').run(total, saleId)
    return saleId
  })()
}

const SALE_COLUMNS = `s.id, s.created_at AS createdAt, s.payment_method AS paymentMethod, s.total_kobo AS totalKobo,
  c.name AS cashier, s.voided_at AS voidedAt, v.name AS voidedBy`

interface SaleRow {
  id: number
  createdAt: string
  paymentMethod: PaymentMethod
  totalKobo: number
  cashier: string
  voidedAt: string | null
  voidedBy: string | null
}

export function listSalesForDay(db: DB, date: string) {
  const [from, to] = shopDayRange(date)
  const rows = db
    .prepare(
      `SELECT ${SALE_COLUMNS},
         (SELECT SUM(l.qty) FROM sale_lines l WHERE l.sale_id = s.id) AS itemCount
       FROM sales s
       JOIN staff c ON c.id = s.cashier_id
       LEFT JOIN staff v ON v.id = s.voided_by
       WHERE s.created_at >= ? AND s.created_at < ?
       ORDER BY s.created_at DESC, s.id DESC`,
    )
    .all(from, to) as (SaleRow & { itemCount: number })[]
  return rows.map((row) => ({ ...row, receiptNo: receiptNo(row.id) }))
}

export function getSale(db: DB, id: number) {
  const sale = db
    .prepare(
      `SELECT ${SALE_COLUMNS} FROM sales s
       JOIN staff c ON c.id = s.cashier_id
       LEFT JOIN staff v ON v.id = s.voided_by
       WHERE s.id = ?`,
    )
    .get(id) as SaleRow | undefined
  if (!sale) throw notFound('That receipt does not exist.')
  const lines = db
    .prepare(
      `SELECT p.name AS product, p.sku, SUM(l.qty) AS qty, l.unit_price_kobo AS unitPriceKobo,
         SUM(l.line_total_kobo) AS lineTotalKobo
       FROM sale_lines l JOIN products p ON p.id = l.product_id
       WHERE l.sale_id = ? GROUP BY l.product_id, l.unit_price_kobo ORDER BY MIN(l.id)`,
    )
    .all(id)
  return { ...sale, receiptNo: receiptNo(sale.id), lines }
}

/** Cancel a sale rung up by mistake and put the items back on the shelf. */
export function voidSale(db: DB, id: number, staff: Staff) {
  db.transaction(() => {
    const sale = db.prepare('SELECT voided_at FROM sales WHERE id = ?').get(id) as { voided_at: string | null } | undefined
    if (!sale) throw notFound('That receipt does not exist.')
    if (sale.voided_at) throw conflict('This sale has already been voided.')
    const lines = db.prepare('SELECT product_id, batch_id, qty FROM sale_lines WHERE sale_id = ?').all(id) as {
      product_id: number
      batch_id: number
      qty: number
    }[]
    for (const line of lines) {
      db.prepare('UPDATE batches SET qty_remaining = qty_remaining + ? WHERE id = ?').run(line.qty, line.batch_id)
      db.prepare('UPDATE products SET stock_on_hand = stock_on_hand + ? WHERE id = ?').run(line.qty, line.product_id)
    }
    db.prepare('UPDATE sales SET voided_at = ?, voided_by = ? WHERE id = ?').run(new Date().toISOString(), staff.id, id)
  })()
}
