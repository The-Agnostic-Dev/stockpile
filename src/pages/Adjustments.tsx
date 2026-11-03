import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Adjustment, ProductDetail } from '../api/types'
import { Notice } from '../components/Notice'
import { formatDateTime, formatDay } from '../lib/dates'
import { useProducts } from '../state/ProductsContext'

export function Adjustments() {
  const { products } = useProducts()
  const [history, setHistory] = useState<Adjustment[]>([])
  const [reasons, setReasons] = useState<string[]>([])
  const [productId, setProductId] = useState('')
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [batchId, setBatchId] = useState('')
  const [direction, setDirection] = useState<'remove' | 'add'>('remove')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function loadHistory() {
    api<{ reasons: string[]; items: Adjustment[] }>('/adjustments').then(
      (data) => {
        setReasons(data.reasons)
        setHistory(data.items)
      },
      (err: Error) => setError(err.message),
    )
  }

  useEffect(loadHistory, [])

  useEffect(() => {
    setBatchId('')
    setProduct(null)
    if (!productId) return
    api<ProductDetail>(`/products/${productId}`).then(setProduct, (err: Error) => setError(err.message))
  }, [productId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    const units = Number(qty)
    if (!Number.isInteger(units) || units < 1) {
      setError('Enter how many units, as a whole number.')
      return
    }
    try {
      await api('/adjustments', {
        method: 'POST',
        json: { batchId: Number(batchId), delta: direction === 'remove' ? -units : units, reason, note },
      })
      setMessage(`Recorded: ${direction === 'remove' ? 'removed' : 'added'} ${units} of ${product?.name}.`)
      setQty('')
      setNote('')
      loadHistory()
      api<ProductDetail>(`/products/${productId}`).then(setProduct)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>Stock adjustments</h1>
      <p className="muted">
        For anything that is not a sale: damaged or expired items taken off the shelf, a stock count that does not match,
        or a customer bringing something back.
      </p>
      <form className="card form-grid" onSubmit={submit} aria-label="New adjustment">
        <label>
          Product
          <select name="product" value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">Choose a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Batch
          <select name="batch" value={batchId} onChange={(e) => setBatchId(e.target.value)} required>
            <option value="">Choose a batch</option>
            {product?.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchNo} (exp. {formatDay(b.expiryDate)}, {b.qtyRemaining} left)
              </option>
            ))}
          </select>
        </label>
        <label>
          Add or remove
          <select name="direction" value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
            <option value="remove">Remove from stock</option>
            <option value="add">Add to stock</option>
          </select>
        </label>
        <label>
          Units
          <input name="qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} required />
        </label>
        <label>
          Reason
          <select name="reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
            <option value="">Choose a reason</option>
            {reasons.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Note
          <input name="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </label>
        <Notice>{error}</Notice>
        <Notice kind="success">{message}</Notice>
        <div className="actions">
          <button type="submit">Record adjustment</button>
        </div>
      </form>

      <h2>Recent adjustments</h2>
      <table className="table" data-testid="adjustments">
        <thead>
          <tr>
            <th>When</th>
            <th>Product</th>
            <th>Batch</th>
            <th className="num">Change</th>
            <th>Reason</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {history.map((a) => (
            <tr key={a.id}>
              <td>{formatDateTime(a.createdAt)}</td>
              <td>{a.product}</td>
              <td>{a.batchNo}</td>
              <td className="num">{a.delta > 0 ? `+${a.delta}` : a.delta}</td>
              <td>
                {a.reason}
                {a.note && <small> ({a.note})</small>}
              </td>
              <td>{a.staff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
