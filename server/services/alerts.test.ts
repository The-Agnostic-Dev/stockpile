import { describe, expect, it } from 'vitest'
import { addDays, shopDate } from '../lib/dates.ts'
import { emptyShop, manager } from '../test-helpers.ts'
import { alerts } from './alerts.ts'
import { receiveBatch } from './stock.ts'

describe('alerts', () => {
  it('flags products that have run down below their reorder level', () => {
    const { db, productId } = emptyShop()
    receiveBatch(db, productId, { batchNo: 'B1', expiryDate: addDays(shopDate(), 500), qty: 4, costKobo: 0 }, manager)
    expect(alerts(db).lowStock).toMatchObject([{ id: productId, stockOnHand: 4, reorderLevel: 10 }])
  })

  it('splits batches into expiring soon and expired', () => {
    const { db, productId } = emptyShop()
    const today = shopDate()
    receiveBatch(db, productId, { batchNo: 'SOON', expiryDate: addDays(today, 20), qty: 5, costKobo: 0 }, manager)
    receiveBatch(db, productId, { batchNo: 'GONE', expiryDate: addDays(today, -1), qty: 5, costKobo: 0 }, manager)
    receiveBatch(db, productId, { batchNo: 'FINE', expiryDate: addDays(today, 200), qty: 5, costKobo: 0 }, manager)
    const result = alerts(db)
    expect(result.expiringSoon.map((b) => (b as { batchNo: string }).batchNo)).toEqual(['SOON'])
    expect(result.expired.map((b) => (b as { batchNo: string }).batchNo)).toEqual(['GONE'])
  })
})
