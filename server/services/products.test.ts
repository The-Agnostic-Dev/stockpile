import { describe, expect, it } from 'vitest'
import { openDb } from '../db.ts'
import { createProduct, listProducts, PRODUCTS_PAGE_SIZE, validateProductInput } from './products.ts'

describe('products', () => {
  it('lists the first page alphabetically with the total', () => {
    const db = openDb(':memory:')
    for (const name of ['Zobo Drink', 'Aspirin', 'milo 400g', 'Bournvita']) {
      createProduct(db, { sku: name.slice(0, 3).toUpperCase(), name, category: 'Provisions', priceKobo: 100, reorderLevel: 1 })
    }
    const page = listProducts(db, {})
    expect(page.items.map((p) => p.name)).toEqual(['Aspirin', 'Bournvita', 'milo 400g', 'Zobo Drink'])
    expect(page.total).toBe(4)
    expect(page.nextOffset).toBeNull()
    expect(listProducts(db, { q: 'MILO' }).items).toHaveLength(1)
  })

  it('signals another page when there are more products than fit', () => {
    const db = openDb(':memory:')
    for (let i = 0; i < PRODUCTS_PAGE_SIZE + 5; i++) {
      createProduct(db, { sku: `SKU-${i}`, name: `Item ${String(i).padStart(2, '0')}`, category: 'Drinks', priceKobo: 100, reorderLevel: 0 })
    }
    const page = listProducts(db, {})
    expect(page.items).toHaveLength(PRODUCTS_PAGE_SIZE)
    expect(page.total).toBe(PRODUCTS_PAGE_SIZE + 5)
    expect(page.nextOffset).not.toBeNull()
  })

  it('validates product details', () => {
    const valid = { sku: 'pcm-500', name: 'Paracetamol', category: 'Medicines', priceKobo: 30000, reorderLevel: 5 }
    expect(validateProductInput(valid).sku).toBe('PCM-500')
    expect(() => validateProductInput({ ...valid, category: 'Cars' })).toThrow(/category/)
    expect(() => validateProductInput({ ...valid, priceKobo: 12.5 })).toThrow(/price/)
  })
})
