import { Hono } from 'hono'
import type { DB } from '../db.ts'
import { badRequest, toInt } from '../lib/http.ts'
import { bearerToken } from '../middleware/auth.ts'
import { listStaff, signIn, signOut, staffForToken } from '../services/staff.ts'

export function authRoutes(db: DB) {
  const r = new Hono()

  // Names for the sign-in screen. No PINs leave the server.
  r.get('/staff', (c) => c.json(listStaff(db)))

  r.post('/auth/login', async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const staffId = toInt(body.staffId)
    if (staffId === null) throw badRequest('Choose your name.')
    const session = signIn(db, staffId, String(body.pin ?? ''))
    if (!session) return c.json({ error: 'That PIN is not correct.' }, 401)
    return c.json(session)
  })

  r.get('/auth/me', (c) => {
    const staff = staffForToken(bearerToken(c.req.header('Authorization')))
    if (!staff) return c.json({ error: 'Please sign in again.' }, 401)
    return c.json(staff)
  })

  r.post('/auth/logout', (c) => {
    signOut(bearerToken(c.req.header('Authorization')))
    return c.body(null, 204)
  })

  return r
}
