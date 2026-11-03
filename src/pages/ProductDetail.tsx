import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../api/client'
import type { Batch, ProductDetail as Detail } from '../api/types'
import { Notice } from '../components/Notice'
import { ProductForm } from '../components/ProductForm'
import { ReceiveStockForm } from '../components/ReceiveStockForm'
import { daysUntil, formatDateTime, formatDay } from '../lib/dates'
import { formatNaira } from '../lib/money'
import { useAuth } from '../state/AuthContext'

function expiryLabel(batch: Batch) {
  const days = daysUntil(batch.expiryDate)
  if (days < 0) return <span className="badge danger">Expired</span>
  if (days === 0) return <span className="badge warn">Expires today</span>
  if (days <= 90) return <span className="badge warn">{days} days left</span>
  return null
}

export function ProductDetail() {
  const { id } = useParams()
  const { canManage } = useAuth()
  const [product, setProduct] = useState<Detail | null>(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    api<Detail>(`/products/${id}`).then(setProduct, (err: Error) => setError(err.message))
  }, [id])

  useEffect(load, [load])

  async function removeBatch(batch: Batch) {
    if (!confirm(`Remove batch ${batch.batchNo}? Only do this if it was entered by mistake.`)) return
    try {
      await api(`/batches/${batch.id}`, { method: 'DELETE' })
      setMessage(`Batch ${batch.batchNo} removed.`)
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!product) return <Notice>{error}</Notice>

  return (
    <section>
      <p>
        <Link to="/products">← All products</Link>
      </p>
      <div className="page-head">
        <h1>{product.name}</h1>
        {canManage && !editing && (
          <button className="secondary" onClick={() => setEditing(true)}>
            Edit details
          </button>
        )}
      </div>
      <Notice>{error}</Notice>
      <Notice kind="success">{message}</Notice>

      {editing ? (
        <div className="card">
          <ProductForm
            initial={product}
            submitLabel="Save changes"
            onCancel={() => setEditing(false)}
            onSubmit={async (values) => {
              const saved = await api<Detail>(`/products/${product.id}`, { method: 'PUT', json: values })
              setProduct(saved)
              setEditing(false)
              setMessage('Product saved.')
            }}
          />
        </div>
      ) : (
        <dl className="facts">
          <div>
            <dt>SKU</dt>
            <dd>{product.sku}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{product.category}</dd>
          </div>
          <div>
            <dt>Selling price</dt>
            <dd data-testid="price">{formatNaira(product.priceKobo)}</dd>
          </div>
          <div>
            <dt>On hand</dt>
            <dd data-testid="on-hand">{product.stockOnHand}</dd>
          </div>
          <div>
            <dt>Can be sold</dt>
            <dd data-testid="sellable">{product.sellable}</dd>
          </div>
          <div>
            <dt>Reorder level</dt>
            <dd>{product.reorderLevel}</dd>
          </div>
        </dl>
      )}

      <h2>Batches</h2>
      <p className="muted">The counter sells from the batch that expires first. Expired batches cannot be sold.</p>
      <table className="table" data-testid="batches">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Expiry</th>
            <th className="num">Received</th>
            <th className="num">Remaining</th>
            <th className="num">Cost</th>
            <th>Received</th>
            {canManage && <th />}
          </tr>
        </thead>
        <tbody>
          {product.batches.map((b) => (
            <tr key={b.id} data-batch-no={b.batchNo}>
              <td>{b.batchNo}</td>
              <td>
                {formatDay(b.expiryDate)} {expiryLabel(b)}
              </td>
              <td className="num">{b.qtyReceived}</td>
              <td className="num remaining">{b.qtyRemaining}</td>
              <td className="num">{formatNaira(b.costKobo)}</td>
              <td>
                {formatDateTime(b.receivedAt)}
                {b.receivedBy && <small> by {b.receivedBy}</small>}
              </td>
              {canManage && (
                <td>
                  {b.untouched && (
                    <button className="link danger" onClick={() => void removeBatch(b)}>
                      Remove
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {product.batches.length === 0 && <p className="muted">No stock has been received yet.</p>}

      {canManage && (
        <>
          <h2>Receive stock</h2>
          <div className="card">
            <ReceiveStockForm
              onSubmit={async (values) => {
                const updated = await api<Detail>(`/products/${product.id}/batches`, { method: 'POST', json: values })
                setProduct(updated)
              }}
            />
          </div>
        </>
      )}
    </section>
  )
}
