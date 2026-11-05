import { describe, expect, it } from 'vitest'
import { cartTotalKobo, formatNaira, koboToInput, nairaToKobo } from './money'

describe('money', () => {
  it('formats kobo as naira', () => {
    expect(formatNaira(1250050)).toBe('₦12,500.50')
    expect(formatNaira(0)).toBe('₦0.00')
  })

  it('reads prices typed by staff', () => {
    expect(nairaToKobo('1500')).toBe(150000)
    expect(nairaToKobo('₦12,500')).toBe(1250000)
    expect(nairaToKobo('250.50')).toBe(25050)
    expect(nairaToKobo('12.10')).toBe(1210)
    expect(nairaToKobo('4.35')).toBe(435)
    expect(nairaToKobo('abc')).toBeNull()
    expect(nairaToKobo('12.345')).toBeNull()
  })

  it('shows prices in edit boxes without needless decimals', () => {
    expect(koboToInput(150000)).toBe('1500')
    expect(koboToInput(25050)).toBe('250.50')
  })

  describe('cartTotalKobo', () => {
    it('multiplies quantity by unit price for a multi-quantity line', () => {
      expect(cartTotalKobo([{ priceKobo: 320000, qty: 3 }])).toBe(960000)
    })

    it('returns the unit price for a single-quantity line', () => {
      expect(cartTotalKobo([{ priceKobo: 320000, qty: 1 }])).toBe(320000)
    })

    it('sums line totals across several lines', () => {
      const lines = [
        { priceKobo: 320000, qty: 3 },
        { priceKobo: 60000, qty: 2 },
        { priceKobo: 45000, qty: 1 },
      ]
      expect(cartTotalKobo(lines)).toBe(960000 + 120000 + 45000)
    })
  })
})
