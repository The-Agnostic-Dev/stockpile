import { describe, expect, it } from 'vitest'
import { addDays, shopDate } from '../lib/dates.ts'
import { emptyShop, manager } from '../test-helpers.ts'
import { getProduct } from './products.ts'
import { createSale, getSale, parseSaleRequest, receiptNo, voidSale } from './sales.ts'
import { receiveBatch } from './stock.ts'

describe('sales', () => {
  it('sells from the batch that expires first and skips expired stock', () => {
    const { db, productId } = emptyShop()
    const today = shopDate()
    receiveBatch(db, productId, { batchNo: 'LATE', expiryDate: addDays(today, 400), qty: 10, costKobo: 0 }, manager)
    receiveBatch(db, productId, { batchNo: 'SOON', expiryDate: addDays(today, 30), qty: 3, costKobo: 0 }, manager)
    receiveBatch(db, productId, { batchNo: 'OLD', expiryDate: addDays(today, -2), qty: 5, costKobo: 0 }, manager)

    createSale(db, { paymentMethod: 'cash', lines: [{ productId, qty: 4 }] }, manager)

    const product = getProduct(db, productId)
    const left = Object.fromEntries(product.batches.map((b) => [b.batchNo, b.qtyRemaining]))
    expect(left).toEqual({ OLD: 5, SOON: 0, LATE: 9 })
    expect(product.stockOnHand).toBe(14)
    expect(product.sellable).toBe(9)
  })

  it('prices the sale from the catalogue and refuses more than is in stock', () => {
    const { db, productId } = emptyShop()
    receiveBatch(db, productId, { batchNo: 'B1', expiryDate: addDays(shopDate(), 100), qty: 5, costKobo: 0 }, manager)
    const id = createSale(db, { paymentMethod: 'pos', lines: [{ productId, qty: 2 }] }, manager)
    expect(getSale(db, id)).toMatchObject({ totalKobo: 60000, cashier: 'Tunde Bello', receiptNo: receiptNo(id) })
    expect(() => createSale(db, { paymentMethod: 'cash', lines: [{ productId, qty: 4 }] }, manager)).toThrow(/Not enough/)
  })

  it('voiding puts the items back', () => {
    const { db, productId } = emptyShop()
    receiveBatch(db, productId, { batchNo: 'B1', expiryDate: addDays(shopDate(), 100), qty: 5, costKobo: 0 }, manager)
    const id = createSale(db, { paymentMethod: 'cash', lines: [{ productId, qty: 2 }] }, manager)
    voidSale(db, id, manager)
    expect(getProduct(db, productId)).toMatchObject({ stockOnHand: 5, sellable: 5 })
    expect(() => voidSale(db, id, manager)).toThrow(/already been voided/)
  })

  it('merges repeated cart lines and rejects bad requests', () => {
    expect(parseSaleRequest({ paymentMethod: 'transfer', lines: [{ productId: 1, qty: 1 }, { productId: 1, qty: 2 }] })).toEqual({
      paymentMethod: 'transfer',
      lines: [{ productId: 1, qty: 3 }],
    })
    expect(() => parseSaleRequest({ paymentMethod: 'cheque', lines: [{ productId: 1, qty: 1 }] })).toThrow()
    expect(() => parseSaleRequest({ paymentMethod: 'cash', lines: [] })).toThrow(/empty/)
  })
})
