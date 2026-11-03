export interface Searchable {
  searchText: string
}

/** Counter search: every word typed must appear somewhere in the product's name or SKU. */
export function matchesQuery(item: Searchable, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return words.every((word) => item.searchText.includes(word))
}

export function searchText(...parts: string[]): string {
  return parts.join(' ')
}
