import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../api/client'
import { PAYMENT_LABELS, type Sale } from '../api/types'
import { Notice } from '../components/Notice'
import { formatDateTime } from '../lib/dates'
import { formatNaira } from '../lib/money'
import { useAuth } from '../state/AuthContext'
import { useProducts } from '../state/ProductsContext'

export function Receipt() {
  const { id } = useParams()
  const { canManage } = useAuth()
  const { refresh } = useProducts()
  const [sale, setSale] = useState<Sale | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Sale>(`/sales/${id}`).then(setSale, (err: Error) => setError(err.message))
  }, [id])

  async function voidSale() {
    if (!sale || !confirm(`Void ${sale.receiptNo}? The items go back into stock.`)) return
    try {
      setSale(await api<Sale>(`/sales/${sale.id}/void`, { method: 'POST' }))
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!sale) return <Notice>{error}</Notice>

  return (
    <section className="receipt">
      <div className="card receipt-card" data-testid="receipt">
        <h1>Mama Ngozi Pharmacy &amp; Provisions</h1>
        <p className="muted">14 Adeniran Ogunsanya St, Surulere, Lagos</p>
        <dl className="receipt-meta">
          <dt>Receipt</dt>
          <dd data-testid="receipt-no">{sale.receiptNo}</dd>
          <dt>Date</dt>
          <dd>{formatDateTime(sale.createdAt)}</dd>
          <dt>Served by</dt>
          <dd data-testid="served-by">{sale.cashier}</dd>
          <dt>Paid by</dt>
          <dd>{PAYMENT_LABELS[sale.paymentMethod]}</dd>
        </dl>
        <table className="table">
          <tbody>
            {sale.lines.map((line, i) => (
              <tr key={i}>
                <td>
                  {line.product}
                  <small>
                    {' '}
                    {line.qty} × {formatNaira(line.unitPriceKobo)}
                  </small>
                </td>
                <td className="num">{formatNaira(line.lineTotalKobo)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th className="num" data-testid="receipt-total">
                {formatNaira(sale.totalKobo)}
              </th>
            </tr>
          </tfoot>
        </table>
        {sale.voidedAt && (
          <p className="notice notice-error">
            Voided {formatDateTime(sale.voidedAt)} by {sale.voidedBy}
          </p>
        )}
        <p className="muted">Thank you. Drugs sold in good condition are not returnable.</p>
      </div>
      <Notice>{error}</Notice>
      <div className="actions no-print">
        <Link className="button" to="/counter">
          Next customer
        </Link>
        <button className="secondary" onClick={() => window.print()}>
          Print
        </button>
        {canManage && !sale.voidedAt && (
          <button className="secondary danger" onClick={() => void voidSale()}>
            Void sale
          </button>
        )}
      </div>
    </section>
  )
}
