import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { CounterProduct } from '../api/types'
import { searchText, type Searchable } from '../lib/search'
import { useAuth } from './AuthContext'

export type CatalogueItem = CounterProduct & Searchable

interface ProductsState {
  products: CatalogueItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const ProductsContext = createContext<ProductsState | null>(null)

/**
 * The whole catalogue, loaded once after sign-in so the counter can search
 * instantly while a customer is waiting.
 */
export function ProductsProvider({ children }: { children: ReactNode }) {
  const { staff } = useAuth()
  const [products, setProducts] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const rows = await api<CounterProduct[]>('/products/catalogue')
      setProducts(rows.map((p) => ({ ...p, searchText: searchText(p.name, p.sku) })))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (staff) void refresh()
  }, [staff, refresh])

  const value = useMemo(() => ({ products, loading, error, refresh }), [products, loading, error, refresh])
  return <ProductsContext value={value}>{children}</ProductsContext>
}

export function useProducts() {
  const value = use(ProductsContext)
  if (!value) throw new Error('useProducts must be used inside ProductsProvider')
  return value
}
