import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import type { Alerts, DailyReport } from '../api/types'
import { Notice } from '../components/Notice'
import { formatDay } from '../lib/dates'
import { formatNaira } from '../lib/money'
import { useAuth } from '../state/AuthContext'

export function Dashboard() {
  const { staff, canManage } = useAuth()
  const [alerts, setAlerts] = useState<Alerts | null>(null)
  const [report, setReport] = useState<DailyReport | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Alerts>('/alerts').then(setAlerts, (err: Error) => setError(err.message))
    if (canManage) api<DailyReport>('/reports/daily').then(setReport, (err: Error) => setError(err.message))
  }, [canManage])

  return (
    <section>
      <h1>Good day, {staff?.name.split(' ')[0]}</h1>
      {alerts && <p className="muted">{formatDay(alerts.today)}</p>}
      <Notice>{error}</Notice>
      <div className="stats">
        {report && (
          <div className="stat">
            <span>Today's sales</span>
            <strong>{formatNaira(report.totalKobo)}</strong>
            <small>{report.salesCount} sales</small>
          </div>
        )}
        {alerts && (
          <>
            <Link className="stat warn" to="/alerts#low-stock">
              <span>Low stock</span>
              <strong>{alerts.lowStock.length}</strong>
              <small>products to reorder</small>
            </Link>
            <Link className="stat warn" to="/alerts#expiring">
              <span>Expiring soon</span>
              <strong>{alerts.expiringSoon.length}</strong>
              <small>batches in the next {alerts.expiryWarningDays} days</small>
            </Link>
            <Link className="stat danger" to="/alerts#expired">
              <span>Expired on the shelf</span>
              <strong>{alerts.expired.length}</strong>
              <small>batches to write off</small>
            </Link>
          </>
        )}
      </div>
      <div className="quick">
        <Link className="button" to="/counter">
          Open the counter
        </Link>
        <Link className="button secondary" to="/products">
          Find a product
        </Link>
      </div>
    </section>
  )
}
