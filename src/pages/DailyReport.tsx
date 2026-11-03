import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PAYMENT_LABELS, type DailyReport as Report } from '../api/types'
import { Notice } from '../components/Notice'
import { formatDay, shopToday } from '../lib/dates'
import { formatNaira } from '../lib/money'

export function DailyReport() {
  const [date, setDate] = useState(shopToday())
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Report>(`/reports/daily?date=${date}`).then(
      (data) => {
        setReport(data)
        setError('')
      },
      (err: Error) => setError(err.message),
    )
  }, [date])

  const average = report && report.salesCount > 0 ? Math.round(report.totalKobo / report.salesCount) : 0

  return (
    <section>
      <div className="page-head">
        <h1>Daily sales report</h1>
        <input
          type="date"
          aria-label="Report date"
          value={date}
          max={shopToday()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
      </div>
      <Notice>{error}</Notice>
      {report && (
        <>
          <p className="muted">{formatDay(report.date)} · voided sales are not counted</p>
          <div className="stats">
            <div className="stat">
              <span>Total sales</span>
              <strong data-testid="report-total">{formatNaira(report.totalKobo)}</strong>
            </div>
            <div className="stat">
              <span>Number of sales</span>
              <strong data-testid="report-count">{report.salesCount}</strong>
            </div>
            <div className="stat">
              <span>Items sold</span>
              <strong>{report.itemsSold}</strong>
            </div>
            <div className="stat">
              <span>Average sale</span>
              <strong>{formatNaira(average)}</strong>
            </div>
          </div>
          <div className="grid-2">
            <div>
              <h2>By payment</h2>
              <table className="table">
                <tbody>
                  {report.byMethod.map((row) => (
                    <tr key={row.method}>
                      <td>{PAYMENT_LABELS[row.method]}</td>
                      <td className="num">{row.count}</td>
                      <td className="num">{formatNaira(row.totalKobo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h2>By staff</h2>
              <table className="table">
                <tbody>
                  {report.byCashier.map((row) => (
                    <tr key={row.cashier}>
                      <td>{row.cashier}</td>
                      <td className="num">{row.count}</td>
                      <td className="num">{formatNaira(row.totalKobo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h2>By category</h2>
              <table className="table">
                <tbody>
                  {report.byCategory.map((row) => (
                    <tr key={row.category}>
                      <td>{row.category}</td>
                      <td className="num">{row.qty}</td>
                      <td className="num">{formatNaira(row.totalKobo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h2>Best sellers</h2>
              <table className="table">
                <tbody>
                  {report.topItems.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td className="num">{row.qty}</td>
                      <td className="num">{formatNaira(row.totalKobo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
