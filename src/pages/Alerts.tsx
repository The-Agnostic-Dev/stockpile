import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import type { Alerts as AlertsData, ExpiringBatch } from '../api/types'
import { Notice } from '../components/Notice'
import { daysUntil, formatDay } from '../lib/dates'

function BatchTable({ rows, testId, today }: { rows: ExpiringBatch[]; testId: string; today: string }) {
  if (rows.length === 0) return <p className="muted">Nothing here.</p>
  return (
    <table className="table" data-testid={testId}>
      <thead>
        <tr>
          <th>Product</th>
          <th>Batch</th>
          <th>Expiry</th>
          <th className="num">Units left</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => {
          const days = daysUntil(b.expiryDate, today)
          return (
            <tr key={b.batchId}>
              <td className="product-name">
                <Link to={`/products/${b.productId}`}>{b.name}</Link>
              </td>
              <td>{b.batchNo}</td>
              <td>
                {formatDay(b.expiryDate)}{' '}
                <small>
                  {days < 0 ? `${-days} days ago` : days === 0 ? 'today' : `in ${days} days`}
                </small>
              </td>
              <td className="num">{b.qtyRemaining}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function Alerts() {
  const [data, setData] = useState<AlertsData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<AlertsData>('/alerts').then(setData, (err: Error) => setError(err.message))
  }, [])

  if (!data) return <Notice>{error}</Notice>

  return (
    <section>
      <h1>Alerts</h1>

      <h2 id="low-stock">Low stock</h2>
      <p className="muted">Products at or below their reorder level. Time to call the supplier.</p>
      {data.lowStock.length === 0 ? (
        <p className="muted">Nothing here.</p>
      ) : (
        <table className="table" data-testid="low-stock">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th className="num">On hand</th>
              <th className="num">Reorder at</th>
            </tr>
          </thead>
          <tbody>
            {data.lowStock.map((p) => (
              <tr key={p.id}>
                <td className="product-name">
                  <Link to={`/products/${p.id}`}>{p.name}</Link>
                </td>
                <td>{p.category}</td>
                <td className="num">{p.stockOnHand}</td>
                <td className="num">{p.reorderLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 id="expiring">Expiring soon</h2>
      <p className="muted">
        Batches that expire within the next {data.expiryWarningDays} days. Put them at the front of the shelf.
      </p>
      <BatchTable rows={data.expiringSoon} testId="expiring" today={data.today} />

      <h2 id="expired">Expired</h2>
      <p className="muted">
        These cannot be sold at the counter. Take them off the shelf and record an adjustment with the reason
        “Expired” so the stock count is right.
      </p>
      <BatchTable rows={data.expired} testId="expired" today={data.today} />
    </section>
  )
}
