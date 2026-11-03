import { describe, expect, it } from 'vitest'
import { formatNaira, koboToInput, nairaToKobo } from './money'

describe('money', () => {
  it('formats kobo as naira', () => {
    expect(formatNaira(1250050)).toBe('₦12,500.50')
    expect(formatNaira(0)).toBe('₦0.00')
  })

  it('reads prices typed by staff', () => {
    expect(nairaToKobo('1500')).toBe(150000)
    expect(nairaToKobo('₦12,500')).toBe(1250000)
    expect(nairaToKobo('250.50')).toBe(25050)
    expect(nairaToKobo('abc')).toBeNull()
    expect(nairaToKobo('12.345')).toBeNull()
  })

  it('shows prices in edit boxes without needless decimals', () => {
    expect(koboToInput(150000)).toBe('1500')
    expect(koboToInput(25050)).toBe('250.50')
  })
})
