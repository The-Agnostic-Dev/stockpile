import type { DB } from '../db.ts'
import { addDays, shopDate } from '../lib/dates.ts'

/** Batches expiring within this many days show under "Expiring soon". */
export const EXPIRY_WARNING_DAYS = 90

export function lowStock(db: DB) {
  return db
    .prepare(
      `SELECT id, sku, name, category, stock_on_hand AS stockOnHand, reorder_level AS reorderLevel
       FROM products
       WHERE reorder_level > 0 AND stock_on_hand < reorder_level
       ORDER BY stock_on_hand * 1.0 / reorder_level, name`,
    )
    .all()
}

function batchesExpiring(db: DB, from: string | null, to: string) {
  return db
    .prepare(
      `SELECT b.id AS batchId, b.batch_no AS batchNo, b.expiry_date AS expiryDate, b.qty_remaining AS qtyRemaining,
         p.id AS productId, p.name, p.sku
       FROM batches b JOIN products p ON p.id = b.product_id
       WHERE b.qty_remaining > 0 AND (@from IS NULL OR b.expiry_date >= @from) AND b.expiry_date <= @to
       ORDER BY b.expiry_date, p.name`,
    )
    .all({ from, to })
}

export function alerts(db: DB) {
  const today = shopDate()
  return {
    today,
    expiryWarningDays: EXPIRY_WARNING_DAYS,
    lowStock: lowStock(db),
    expiringSoon: batchesExpiring(db, today, addDays(today, EXPIRY_WARNING_DAYS)),
    expired: batchesExpiring(db, null, addDays(today, -1)),
  }
}
