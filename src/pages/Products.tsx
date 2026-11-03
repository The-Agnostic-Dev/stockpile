import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import type { Product, ProductPage } from '../api/types'
import { CATEGORIES } from '../components/ProductForm'
import { Notice } from '../components/Notice'
import { formatNaira } from '../lib/money'
import { useAuth } from '../state/AuthContext'

function pageUrl(q: string, category: string, offset: number) {
  const params = new URLSearchParams({ q, category, offset: String(offset) })
  return `/products?${params}`
}

export function Products() {
  const { canManage } = useAuth()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [items, setItems] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      api<ProductPage>(pageUrl(q, category, 0))
        .then((page) => {
          if (cancelled) return
          setItems(page.items)
          setTotal(page.total)
          setNextOffset(page.nextOffset)
          setError('')
        })
        .catch((err: Error) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoading(false))
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [q, category])

  async function loadMore() {
    if (nextOffset === null) return
    setLoading(true)
    try {
      const page = await api<ProductPage>(pageUrl(q, category, nextOffset))
      setItems((current) => [...current, ...page.items])
      setNextOffset(page.nextOffset)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <div className="page-head">
        <h1>Products</h1>
        {canManage && (
          <Link className="button" to="/products/new">
            Add product
          </Link>
        )}
      </div>
      <div className="filters">
        <input
          type="search"
          placeholder="Search by name or SKU"
          aria-label="Search products"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="muted" data-testid="product-count">
          {total} products
        </span>
      </div>
      <Notice>{error}</Notice>
      <table className="table" data-testid="products">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th className="num">Price</th>
            <th className="num">On hand</th>
            <th className="num">Reorder at</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} data-product-id={p.id} className={p.stockOnHand <= p.reorderLevel ? 'row-warn' : undefined}>
              <td className="product-name">
                <Link to={`/products/${p.id}`}>{p.name}</Link>
              </td>
              <td>{p.sku}</td>
              <td>{p.category}</td>
              <td className="num">{formatNaira(p.priceKobo)}</td>
              <td className="num on-hand">{p.stockOnHand}</td>
              <td className="num">{p.reorderLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && !loading && <p className="muted">No products match.</p>}
      {nextOffset !== null && (
        <button className="secondary" onClick={() => void loadMore()} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </section>
  )
}
