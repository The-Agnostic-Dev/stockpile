import { Hono } from 'hono'
import type { DB } from '../db.ts'
import { currentStaff } from '../lib/context.ts'
import { isIsoDate, shopDate } from '../lib/dates.ts'
import { badRequest } from '../lib/http.ts'
import { requireRole } from '../middleware/auth.ts'
import { createSale, getSale, listSalesForDay, parseSaleRequest, voidSale } from '../services/sales.ts'

export function salesRoutes(db: DB) {
  const r = new Hono()

  r.get('/sales', (c) => {
    const date = c.req.query('date') || shopDate()
    if (!isIsoDate(date)) throw badRequest('Pick a valid date.')
    return c.json(listSalesForDay(db, date))
  })

  r.post('/sales', async (c) => {
    const request = parseSaleRequest(await c.req.json())
    const id = createSale(db, request, currentStaff())
    return c.json(getSale(db, id), 201)
  })

  r.get('/sales/:id', (c) => c.json(getSale(db, Number(c.req.param('id')))))

  r.post('/sales/:id/void', requireRole('owner', 'manager'), (c) => {
    const id = Number(c.req.param('id'))
    voidSale(db, id, currentStaff())
    return c.json(getSale(db, id))
  })

  return r
}
