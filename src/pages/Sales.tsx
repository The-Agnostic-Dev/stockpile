import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import { PAYMENT_LABELS, type PaymentMethod, type SaleSummary } from '../api/types'
import { Notice } from '../components/Notice'
import { formatTime, shopToday } from '../lib/dates'
import { formatNaira } from '../lib/money'

export function Sales() {
  const [date, setDate] = useState(shopToday())
  const [method, setMethod] = useState<'all' | PaymentMethod>('all')
  const [sales, setSales] = useState<SaleSummary[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api<SaleSummary[]>(`/sales?date=${date}`).then(
      (rows) => {
        setSales(rows)
        setError('')
      },
      (err: Error) => setError(err.message),
    )
  }, [date])

  const visible = useMemo(
    () => (method === 'all' ? sales : sales.filter((s) => s.paymentMethod === method)),
    [sales],
  )
  const takings = visible.filter((s) => !s.voidedAt).reduce((sum, s) => sum + s.totalKobo, 0)

  return (
    <section>
      <h1>Sales</h1>
      <div className="filters">
        <label>
          Day
          <input type="date" value={date} max={shopToday()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <label>
          Paid by
          <select aria-label="Paid by" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="all">All</option>
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <span className="muted">
          {visible.length} sales · {formatNaira(takings)}
        </span>
      </div>
      <Notice>{error}</Notice>
      <table className="table" data-testid="sales">
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Time</th>
            <th>Served by</th>
            <th>Paid by</th>
            <th className="num">Items</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((s) => (
            <tr key={s.id} className={s.voidedAt ? 'row-void' : undefined}>
              <td>
                <Link to={`/sales/${s.id}`}>{s.receiptNo}</Link>
                {s.voidedAt && <span className="badge danger">Void</span>}
              </td>
              <td>{formatTime(s.createdAt)}</td>
              <td>{s.cashier}</td>
              <td className="method">{PAYMENT_LABELS[s.paymentMethod]}</td>
              <td className="num">{s.itemCount}</td>
              <td className="num">{formatNaira(s.totalKobo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && <p className="muted">No sales on this day.</p>}
    </section>
  )
}
