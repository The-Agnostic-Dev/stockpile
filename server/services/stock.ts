import type { DB } from '../db.ts'
import { shopDate } from '../lib/dates.ts'
import { badRequest, conflict, notFound } from '../lib/http.ts'
import type { Staff } from './staff.ts'

export interface ReceiveInput {
  batchNo: string
  expiryDate: string
  qty: number
  costKobo: number
}

/** Add a delivered batch to the shelf. */
export function receiveBatch(db: DB, productId: number, input: ReceiveInput, staff: Staff): number {
  return db.transaction(() => {
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId)
    if (!product) throw notFound('That product does not exist.')
    const result = db
      .prepare(
        `INSERT INTO batches (product_id, batch_no, expiry_date, qty_received, qty_remaining, cost_kobo, received_at, received_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(productId, input.batchNo, input.expiryDate, input.qty, input.qty, input.costKobo, new Date().toISOString(), staff.id)
    db.prepare('UPDATE products SET stock_on_hand = stock_on_hand + ? WHERE id = ?').run(input.qty, productId)
    return Number(result.lastInsertRowid)
  })()
}

/** Remove a batch that was entered by mistake (only while nothing has been sold or adjusted from it). */
export function deleteBatch(db: DB, batchId: number) {
  db.transaction(() => {
    const batch = db.prepare('SELECT product_id, qty_remaining, qty_received FROM batches WHERE id = ?').get(batchId) as
      | { product_id: number; qty_remaining: number; qty_received: number }
      | undefined
    if (!batch) throw notFound('That batch does not exist.')
    const used =
      db.prepare('SELECT 1 FROM sale_lines WHERE batch_id = ?').get(batchId) ||
      db.prepare('SELECT 1 FROM adjustments WHERE batch_id = ?').get(batchId)
    if (used) throw conflict('Stock from this batch has already moved. Record an adjustment instead.')
    db.prepare('DELETE FROM batches WHERE id = ?').run(batchId)
    db.prepare('UPDATE products SET stock_on_hand = stock_on_hand - ? WHERE id = ?').run(batch.qty_remaining, batch.product_id)
  })()
}

export interface Allocation {
  batchId: number
  qty: number
}

/**
 * Pick stock for a sale, first-expiry-first-out, skipping expired batches.
 * Must run inside the caller's transaction.
 */
export function allocate(db: DB, productId: number, qty: number): Allocation[] {
  const batches = db
    .prepare(
      `SELECT id, qty_remaining FROM batches
       WHERE product_id = ? AND qty_remaining > 0 AND expiry_date >= ?
       ORDER BY expiry_date, id`,
    )
    .all(productId, shopDate()) as { id: number; qty_remaining: number }[]
  const picks: Allocation[] = []
  let needed = qty
  for (const batch of batches) {
    if (needed === 0) break
    const take = Math.min(batch.qty_remaining, needed)
    picks.push({ batchId: batch.id, qty: take })
    needed -= take
  }
  return needed === 0 ? picks : []
}

export const ADJUSTMENT_REASONS = ['Damaged', 'Expired', 'Count correction', 'Customer return', 'Theft or loss'] as const

export interface AdjustmentInput {
  batchId: number
  delta: number
  reason: string
  note: string
}

export function recordAdjustment(db: DB, input: AdjustmentInput, staff: Staff): number {
  if (!(ADJUSTMENT_REASONS as readonly string[]).includes(input.reason)) throw badRequest('Choose a reason.')
  if (!Number.isInteger(input.delta) || input.delta === 0) throw badRequest('Enter how many units to add or remove.')
  return db.transaction(() => {
    const batch = db.prepare('SELECT id, product_id, qty_remaining FROM batches WHERE id = ?').get(input.batchId) as
      | { id: number; product_id: number; qty_remaining: number }
      | undefined
    if (!batch) throw notFound('That batch does not exist.')
    if (batch.qty_remaining + input.delta < 0) {
      throw badRequest(`This batch only has ${batch.qty_remaining} left.`)
    }
    db.prepare('UPDATE batches SET qty_remaining = qty_remaining + ? WHERE id = ?').run(input.delta, batch.id)
    const result = db
      .prepare(
        `INSERT INTO adjustments (product_id, batch_id, delta, reason, note, created_at, staff_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(batch.product_id, batch.id, input.delta, input.reason, input.note.trim(), new Date().toISOString(), staff.id)
    return Number(result.lastInsertRowid)
  })()
}

export function listAdjustments(db: DB, limit = 50) {
  return db
    .prepare(
      `SELECT a.id, a.created_at AS createdAt, a.delta, a.reason, a.note, p.name AS product,
         b.batch_no AS batchNo, s.name AS staff
       FROM adjustments a
       JOIN products p ON p.id = a.product_id
       JOIN batches b ON b.id = a.batch_id
       JOIN staff s ON s.id = a.staff_id
       ORDER BY a.created_at DESC, a.id DESC LIMIT ?`,
    )
    .all(limit)
}
