import { Hono } from 'hono'
import type { DB } from '../db.ts'
import { currentStaff } from '../lib/context.ts'
import { isIsoDate, shopDate } from '../lib/dates.ts'
import { badRequest, toInt } from '../lib/http.ts'
import { requireRole } from '../middleware/auth.ts'
import { alerts } from '../services/alerts.ts'
import { dailyReport } from '../services/reports.ts'
import { ADJUSTMENT_REASONS, listAdjustments, recordAdjustment } from '../services/stock.ts'

const managers = requireRole('owner', 'manager')

export function stockRoutes(db: DB) {
  const r = new Hono()

  r.get('/alerts', (c) => c.json(alerts(db)))

  r.get('/adjustments', managers, (c) => c.json({ reasons: ADJUSTMENT_REASONS, items: listAdjustments(db) }))

  r.post('/adjustments', managers, async (c) => {
    const body = await c.req.json()
    const batchId = toInt(body.batchId)
    if (batchId === null) throw badRequest('Choose the batch.')
    const id = recordAdjustment(
      db,
      { batchId, delta: toInt(body.delta) ?? 0, reason: String(body.reason ?? ''), note: String(body.note ?? '') },
      currentStaff(),
    )
    return c.json({ id }, 201)
  })

  r.get('/reports/daily', managers, (c) => {
    const date = c.req.query('date') || shopDate()
    if (!isIsoDate(date)) throw badRequest('Pick a valid date.')
    return c.json(dailyReport(db, date))
  })

  return r
}
