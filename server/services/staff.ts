import { randomBytes } from 'node:crypto'
import type { DB } from '../db.ts'

export type Role = 'owner' | 'manager' | 'counter'

export interface Staff {
  id: number
  name: string
  role: Role
}

const sessions = new Map<string, Staff>()

export function listStaff(db: DB): Staff[] {
  return db.prepare('SELECT id, name, role FROM staff ORDER BY id').all() as Staff[]
}

export function signIn(db: DB, staffId: number, pin: string): { token: string; staff: Staff } | null {
  const row = db.prepare('SELECT id, name, role, pin FROM staff WHERE id = ?').get(staffId) as
    | (Staff & { pin: string })
    | undefined
  if (!row || row.pin !== pin) return null
  const staff: Staff = { id: row.id, name: row.name, role: row.role }
  const token = randomBytes(24).toString('base64url')
  sessions.set(token, staff)
  return { token, staff }
}

export function staffForToken(token: string | undefined): Staff | null {
  if (!token) return null
  return sessions.get(token) ?? null
}

export function signOut(token: string | undefined) {
  if (token) sessions.delete(token)
}

export const canManageStock = (staff: Staff) => staff.role === 'owner' || staff.role === 'manager'
