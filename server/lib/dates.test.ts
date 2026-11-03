import { describe, expect, it } from 'vitest'
import { addDays, isIsoDate, shopDate, shopDayRange } from './dates.ts'

describe('shop dates', () => {
  it('uses Lagos time for the calendar day', () => {
    expect(shopDate(new Date('2026-03-09T23:30:00Z'))).toBe('2026-03-10')
    expect(shopDate(new Date('2026-03-09T22:30:00Z'))).toBe('2026-03-09')
  })

  it('gives the UTC range of a shop day', () => {
    expect(shopDayRange('2026-03-10')).toEqual(['2026-03-09T23:00:00.000Z', '2026-03-10T23:00:00.000Z'])
  })

  it('adds days across month ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
  })

  it('validates calendar dates', () => {
    expect(isIsoDate('2026-02-28')).toBe(true)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('28/02/2026')).toBe(false)
  })
})
