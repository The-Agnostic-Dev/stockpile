import { openDb, type DB } from './db.ts'
import type { Staff } from './services/staff.ts'

export const manager: Staff = { id: 2, name: 'Tunde Bello', role: 'manager' }

/** An empty in-memory shop with staff and one product, for service tests. */
export function emptyShop(): { db: DB; productId: number } {
  const db = openDb(':memory:')
  db.prepare("INSERT INTO staff (id, name, role, pin) VALUES (1, 'Ngozi Okeke', 'owner', '0000'), (2, 'Tunde Bello', 'manager', '1111')").run()
  const productId = Number(
    db
      .prepare(
        `INSERT INTO products (sku, name, category, price_kobo, reorder_level, stock_on_hand, created_at)
         VALUES ('PCM-500', 'Paracetamol 500mg', 'Medicines', 30000, 10, 0, '2026-01-01T09:00:00.000Z')`,
      )
      .run().lastInsertRowid,
  )
  return { db, productId }
}
