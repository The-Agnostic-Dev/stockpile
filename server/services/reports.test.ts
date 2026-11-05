import { describe, it, expect, beforeEach } from 'vitest'
import { openDb, resetDb, type DB } from '../db.ts'
import { receiveBatch } from './stock.ts'
import { createSale } from './sales.ts'
import { dailyReport } from './reports.ts'
import type { Staff } from './staff.ts'

describe('dailyReport', () => {
  let db: DB
  let staff: Staff
  let productId: number

  beforeEach(() => {
    db = openDb(':memory:')
    resetDb(db)

    const staffResult = db.prepare('INSERT INTO staff (name, role, pin) VALUES (?, ?, ?)').run('Test Owner', 'owner', '1234')
    const staffId = Number(staffResult.lastInsertRowid)
    staff = { id: staffId, name: 'Test Owner', role: 'owner' }

    const productResult = db.prepare('INSERT INTO products (sku, name, category, price_kobo, reorder_level, stock_on_hand) VALUES (?, ?, ?, ?, ?, ?)').run('TEST-1', 'Test Product', 'Medicines', 30000, 0, 0)
    productId = Number(productResult.lastInsertRowid)

    receiveBatch(db, productId, {
      batchNo: 'B1',
      expiryDate: '2026-01-01',
      qty: 4,
      costKobo: 20000,
    }, staff)
  })

  it('sums sales over the Lagos shop day, not the UTC date', () => {
    const saleIds: number[] = []
    for (let i = 0; i < 4; i++) {
      const saleId = createSale(db, {
        paymentMethod: 'cash',
        lines: [{ productId, qty: 1 }],
      }, staff)
      saleIds.push(saleId)
    }

    const timestamps = [
      '2025-03-09T23:30:00.000Z',
      '2025-03-09T23:45:00.000Z',
      '2025-03-10T12:00:00.000Z',
      '2025-03-10T23:30:00.000Z',
    ]
    const setTime = db.prepare('UPDATE sales SET created_at = ? WHERE id = ?')
    saleIds.forEach((id, index) => setTime.run(timestamps[index], id))

    const report = dailyReport(db, '2025-03-10')
    expect(report.salesCount).toBe(3)
    expect(report.totalKobo).toBe(90000)
    expect(report.itemsSold).toBe(3)

    const nextReport = dailyReport(db, '2025-03-11')
    expect(nextReport.salesCount).toBe(1)
    expect(nextReport.totalKobo).toBe(30000)
    expect(nextReport.itemsSold).toBe(1)
  })
})
