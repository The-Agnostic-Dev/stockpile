import { describe, expect, it } from 'vitest'
import { matchesQuery, searchText } from './search'

describe('counter search', () => {
  const item = { searchText: searchText('Paracetamol 500mg Tablets (Emzor)', 'PCM-500') }

  it('matches when every word appears', () => {
    expect(matchesQuery(item, '500')).toBe(true)
    expect(matchesQuery(item, '500 -500')).toBe(true)
  })

  it('does not match unrelated words', () => {
    expect(matchesQuery(item, '500 syrup')).toBe(false)
  })
})
