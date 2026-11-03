import type { DB } from './db.ts'
import { resetDb } from './db.ts'
import { addDays, shopDate, shopDayStart } from './lib/dates.ts'
import { createSale, type PaymentMethod } from './services/sales.ts'
import type { Staff } from './services/staff.ts'

// Demo data for Mama Ngozi Pharmacy & Provisions, Surulere. Dates are relative to today.

const STAFF: [string, Staff['role'], string][] = [
  ['Ngozi Okeke', 'owner', '2580'],
  ['Tunde Bello', 'manager', '1357'],
  ['Bisi Adewale', 'counter', '2468'],
  ['Musa Ibrahim', 'counter', '1122'],
]

// sku, name, category, price (naira), reorder level, batches as [qty, days to expiry]
type Row = [string, string, string, number, number, [number, number][]]

const PRODUCTS: Row[] = [
  ['ALW-MAX', 'Always Maxi Thick Pads (8)', 'Personal care', 900, 10, [[24, 700]]],
  ['AMX-500', 'Amoxicillin 500mg Capsules (Emzor)', 'Medicines', 1500, 10, [[6, -5]]],
  ['ART-80', 'Artemether/Lumefantrine 80/480 (Lonart DS)', 'Medicines', 2800, 8, [[25, 420]]],
  ['BEN-100', 'Benylin Chesty Cough 100ml', 'Medicines', 1800, 6, [[14, 300]]],
  ['BNV-500', 'Bournvita 500g Pouch', 'Provisions', 2600, 6, [[18, 240]]],
  ['BSP-10', 'Buscopan 10mg Tablets', 'Medicines', 2200, 5, [[12, 500]]],
  ['CPD-20', 'Coartem 20/120 Tablets', 'Medicines', 3500, 6, [[15, 75], [10, 600]]],
  ['CLU-140', 'Close-up Toothpaste 140g', 'Personal care', 850, 12, [[40, 650]]],
  ['COK-50', 'Coca-Cola 50cl', 'Drinks', 300, 24, [[96, 150]]],
  ['CTZ-10', 'Cetirizine 10mg Tablets', 'Medicines', 600, 10, [[30, 540]]],
  ['CRL-400', 'Cerelac Wheat 400g', 'Baby care', 3900, 5, [[9, 60]]],
  ['DAN-400', 'Dano Milk Powder 400g', 'Provisions', 3100, 6, [[16, 330]]],
  ['DTL-500', 'Dettol Antiseptic Liquid 500ml', 'First aid', 2400, 10, [[10, 900]]],
  ['DGS-400', 'Digestive Biscuits 400g', 'Provisions', 1200, 8, [[20, 120]]],
  ['EVA-75', 'Eva Table Water 75cl', 'Drinks', 200, 48, [[240, 365]]],
  ['FLG-200', 'Flagyl 200mg Tablets', 'Medicines', 700, 10, [[45, 480]]],
  ['GAL-120', 'Gala Sausage Roll', 'Provisions', 200, 20, [[40, 9]]],
  ['GLM-500', 'Golden Morn 500g', 'Provisions', 2100, 6, [[14, 210]]],
  ['HOL-100', 'Hollandia Yoghurt 1L', 'Drinks', 2300, 6, [[12, 25]]],
  ['IBU-400', 'Ibuprofen 400mg Tablets', 'Medicines', 500, 15, [[60, 610]]],
  ['IND-70', 'Indomie Chicken 70g', 'Provisions', 250, 40, [[160, 200]]],
  ['IND-SPR', 'Indomie Onion Chicken 120g (Super Pack)', 'Provisions', 400, 20, [[60, 200]]],
  ['LIP-50', 'Lipton Yellow Label Tea (50 bags)', 'Provisions', 1600, 6, [[15, 400]]],
  ['LOP-2', 'Loperamide 2mg Capsules', 'Medicines', 450, 8, [[30, 380]]],
  ['MLG-33', 'Malta Guinness Can 33cl', 'Drinks', 600, 24, [[72, 180]]],
  ['MEN-28', 'Mentholatum Ointment 28g', 'First aid', 750, 10, [[25, 720]]],
  ['MLO-400', 'Milo Refill 400g', 'Provisions', 3000, 6, [[18, 260]]],
  ['MTF-500', 'Metformin 500mg Tablets', 'Medicines', 1200, 8, [[28, 450]]],
  ['NVA-400', 'Nivea Body Lotion 400ml', 'Personal care', 4500, 4, [[10, 800]]],
  ['ORS-1', 'Oral Rehydration Salts (ORS) Sachet', 'First aid', 150, 20, [[80, 520]]],
  ['PMP-3', 'Pampers Baby Dry Size 3 (Jumbo)', 'Baby care', 9800, 3, [[7, 900]]],
  ['PDL-X', 'Panadol Extra Tablets', 'Medicines', 1000, 20, [[50, 70], [40, 560]]],
  ['PCM-500', 'Paracetamol 500mg Tablets (Emzor)', 'Medicines', 300, 30, [[120, 600]]],
  ['PEK-400', 'Peak Milk Tin 400g', 'Provisions', 3200, 8, [[30, 360]]],
  ['PLS-PL', 'Plaster Strips (Elastoplast, 20)', 'First aid', 1100, 6, [[18, 1000]]],
  ['ROB-25', 'Robb Ointment 25g', 'First aid', 650, 10, [[30, 800]]],
  ['SEM-1', 'Semovita 1kg', 'Provisions', 1900, 8, [[22, 270]]],
  ['SEP-1', 'Septrin Tablets', 'Medicines', 800, 8, [[26, 430]]],
  ['SUG-500', 'St Louis Sugar Cubes 500g', 'Provisions', 1400, 6, [[20, 700]]],
  ['TOM-70', 'Tom Tom Mints (Pack)', 'Provisions', 500, 10, [[35, 300]]],
  ['VSL-100', 'Vaseline Petroleum Jelly 100ml', 'Personal care', 1300, 8, [[24, 900]]],
  ['VNT-100', 'Ventolin Inhaler 100mcg', 'Medicines', 5500, 3, [[0, 400]]],
  ['VTB-CO', 'Vitamin B Complex Tablets', 'Vitamins & supplements', 600, 10, [[40, 500]]],
  ['VTC-1000', 'Vitamin C 1000mg Effervescent (Redoxon)', 'Vitamins & supplements', 4200, 10, [[30, 540]]],
  ['VTC-100', 'Vitamin C 100mg Tablets (Emzor)', 'Vitamins & supplements', 400, 20, [[90, 20], [60, 480]]],
  ['WPS-60', 'Baby Wipes (Huggies, 56)', 'Baby care', 2200, 6, [[15, 650]]],
  ['ZIN-20', 'Zinc Sulphate 20mg Tablets', 'Vitamins & supplements', 900, 8, [[22, 700]]],
]

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seedDemo(db: DB) {
  const random = mulberry32(20261103)
  const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]
  const today = shopDate()
  const now = new Date()

  db.transaction(() => {
    resetDb(db)
    const staff = STAFF.map(([name, role, pin], i) => {
      db.prepare('INSERT INTO staff (id, name, role, pin) VALUES (?, ?, ?, ?)').run(i + 1, name, role, pin)
      return { id: i + 1, name, role }
    })
    const [owner, manager, ...counter] = staff

    const receivedAt = new Date(shopDayStart(addDays(today, -21)).getTime() + 10 * 3600_000).toISOString()
    const insertProduct = db.prepare(
      `INSERT INTO products (sku, name, category, price_kobo, reorder_level, stock_on_hand, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
    )
    const insertBatch = db.prepare(
      `INSERT INTO batches (product_id, batch_no, expiry_date, qty_received, qty_remaining, cost_kobo, received_at, received_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const productIds: number[] = []
    for (const [sku, name, category, price, reorder, batches] of PRODUCTS) {
      const id = Number(insertProduct.run(sku, name, category, price * 100, reorder, receivedAt).lastInsertRowid)
      productIds.push(id)
      let stock = 0
      batches.forEach(([qty, days], i) => {
        const received = qty === 0 ? 12 : qty
        const batchNo = `${sku.split('-')[0]}${String(2400 + id * 7 + i).padStart(5, '0')}`
        insertBatch.run(id, batchNo, addDays(today, days), received, qty, Math.round(price * 70), receivedAt, manager.id)
        stock += qty
      })
      db.prepare('UPDATE products SET stock_on_hand = ? WHERE id = ?').run(stock, id)
    }

    // Sales: a week of trading. Everyday items sell most; the big-ticket items rarely.
    const everyday = productIds.filter((_, i) => PRODUCTS[i][3] <= 1200 && PRODUCTS[i][5].some(([q, d]) => q > 20 && d > 30))
    const methods: PaymentMethod[] = ['cash', 'cash', 'transfer', 'transfer', 'pos']
    const setTime = db.prepare('UPDATE sales SET created_at = ? WHERE id = ?')
    const ring = (at: Date, cashier: Staff, method: PaymentMethod = pick(methods)) => {
      const count = 1 + Math.floor(random() * 3)
      const lines = new Map<number, number>()
      for (let i = 0; i < count; i++) lines.set(pick(everyday), 1 + Math.floor(random() * 3))
      const id = createSale(
        db,
        { paymentMethod: method, lines: [...lines].map(([productId, qty]) => ({ productId, qty })) },
        cashier,
      )
      setTime.run(at.toISOString(), id)
    }

    for (let back = 6; back >= 1; back--) {
      const dayStart = shopDayStart(addDays(today, -back)).getTime()
      const perDay = 6 + Math.floor(random() * 5)
      // Now and then someone knocks after midnight for emergency drugs.
      if (back === 3) ring(new Date(dayStart + 45 * 60_000), counter[0], 'transfer')
      for (let i = 0; i < perDay; i++) {
        const minutes = 8 * 60 + Math.floor(((i + random()) / perDay) * 13 * 60)
        ring(new Date(dayStart + minutes * 60_000), pick(counter))
      }
    }

    // Today: the night-shift sale just after midnight, then the day so far.
    const todayStart = shopDayStart(today).getTime()
    const elapsed = Math.max(2, Math.floor((now.getTime() - todayStart) / 60_000) - 2)
    const first = Math.min(20, elapsed - 1)
    ring(new Date(todayStart + first * 60_000), counter[1], 'cash')
    const later = 7
    for (let i = 1; i <= later; i++) {
      const minutes = first + Math.floor(((elapsed - first) * i) / (later + 1))
      ring(new Date(todayStart + minutes * 60_000), i % 3 === 0 ? manager : pick(counter), methods[i % methods.length])
    }

    // A couple of past write-offs so the adjustments page has history.
    const writeOff = (productIndex: number, delta: number, reason: string, note: string, daysAgo: number) => {
      const productId = productIds[productIndex]
      const batch = db.prepare('SELECT id FROM batches WHERE product_id = ? ORDER BY id LIMIT 1').get(productId) as { id: number }
      db.prepare('UPDATE batches SET qty_remaining = qty_remaining + ? WHERE id = ?').run(delta, batch.id)
      db.prepare('UPDATE products SET stock_on_hand = stock_on_hand + ? WHERE id = ?').run(delta, productId)
      const at = new Date(shopDayStart(addDays(today, -daysAgo)).getTime() + 18 * 3600_000).toISOString()
      db.prepare(
        `INSERT INTO adjustments (product_id, batch_id, delta, reason, note, created_at, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(productId, batch.id, delta, reason, note, at, owner.id)
    }
    writeOff(PRODUCTS.findIndex((p) => p[0] === 'COK-50'), -2, 'Damaged', 'Two bottles cracked in the crate', 4)
    writeOff(PRODUCTS.findIndex((p) => p[0] === 'IBU-400'), 3, 'Count correction', 'Found a strip behind the shelf', 2)
  })()
}
