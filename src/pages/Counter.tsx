import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api/client'
import { PAYMENT_LABELS, type PaymentMethod, type Sale } from '../api/types'
import { Notice } from '../components/Notice'
import { cartTotal, formatNaira } from '../lib/money'
import { matchesQuery } from '../lib/search'
import { useProducts, type CatalogueItem } from '../state/ProductsContext'

interface CartLine {
  productId: number
  name: string
  priceKobo: number
  qty: number
  available: number
}

const MAX_RESULTS = 8

export function Counter() {
  const navigate = useNavigate()
  const { products, loading, refresh } = useProducts()
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const results = useMemo(
    () => (query.trim() ? products.filter((p) => matchesQuery(p, query)).slice(0, MAX_RESULTS) : []),
    [products, query],
  )

  const total = useMemo(() => cartTotal(cart), [cart])

  function inCart(productId: number) {
    return cart.find((l) => l.productId === productId)?.qty ?? 0
  }

  function add(product: CatalogueItem) {
    setError('')
    setCart((current) => {
      const existing = current.find((l) => l.productId === product.id)
      if (existing) {
        return current.map((l) => (l.productId === product.id ? { ...l, qty: Math.min(l.qty + 1, l.available) } : l))
      }
      return [
        ...current,
        { productId: product.id, name: product.name, priceKobo: product.priceKobo, qty: 1, available: product.sellable },
      ]
    })
    setQuery('')
  }

  function setQty(productId: number, value: string) {
    const qty = Math.max(1, Math.floor(Number(value) || 1))
    setCart((current) => current.map((l) => (l.productId === productId ? { ...l, qty: Math.min(qty, l.available) } : l)))
  }

  function remove(productId: number) {
    setCart((current) => current.filter((l) => l.productId !== productId))
  }

  async function completeSale() {
    setSubmitting(true)
    setError('')
    try {
      const sale = await api<Sale>('/sales', {
        method: 'POST',
        json: { paymentMethod: method, lines: cart.map(({ productId, qty }) => ({ productId, qty })) },
      })
      setCart([])
      await refresh()
      navigate(`/sales/${sale.id}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="counter">
      <div className="counter-search">
        <h1>Counter</h1>
        <input
          type="search"
          autoFocus
          placeholder="Type a product name or SKU"
          aria-label="Find product"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <p className="muted">Loading products…</p>}
        <ul className="results" data-testid="results">
          {results.map((p) => {
            const left = p.sellable - inCart(p.id)
            return (
              <li key={p.id} data-product-id={p.id}>
                <div>
                  <strong className="result-name">{p.name}</strong>
                  <small>
                    {p.sku} · <span className="available">{p.sellable > 0 ? `${p.sellable} available` : 'Out of stock'}</span>
                  </small>
                </div>
                <span className="result-price">{formatNaira(p.priceKobo)}</span>
                <button onClick={() => add(p)} disabled={left <= 0}>
                  Add
                </button>
              </li>
            )
          })}
        </ul>
        {query.trim() && results.length === 0 && !loading && <p className="muted">Nothing matches “{query}”.</p>}
      </div>

      <div className="card cart">
        <h2>Cart</h2>
        {cart.length === 0 ? (
          <p className="muted">Search for a product and press Add.</p>
        ) : (
          <table className="table" data-testid="cart">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Price</th>
                <th className="num">Qty</th>
                <th className="num">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cart.map((line) => (
                <tr key={line.productId}>
                  <td>{line.name}</td>
                  <td className="num">{formatNaira(line.priceKobo)}</td>
                  <td className="num">
                    <input
                      className="qty"
                      type="number"
                      min={1}
                      max={line.available}
                      aria-label={`Quantity of ${line.name}`}
                      value={line.qty}
                      onChange={(e) => setQty(line.productId, e.target.value)}
                    />
                  </td>
                  <td className="num">{formatNaira(line.priceKobo * line.qty)}</td>
                  <td>
                    <button className="link danger" onClick={() => remove(line.productId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="cart-total">
          <span>Total</span>
          <strong data-testid="cart-total">{formatNaira(total)}</strong>
        </div>
        <label>
          Payment
          <select aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Notice>{error}</Notice>
        <div className="actions">
          <button onClick={() => void completeSale()} disabled={cart.length === 0 || submitting}>
            {submitting ? 'Saving…' : 'Complete sale'}
          </button>
          <button className="secondary" onClick={() => setCart([])} disabled={cart.length === 0}>
            Clear cart
          </button>
        </div>
      </div>
    </section>
  )
}
