import type { MiddlewareHandler } from 'hono'
import { currentStaff, setCurrentStaff } from '../lib/context.ts'
import { ApiError } from '../lib/http.ts'
import { staffForToken, type Role } from '../services/staff.ts'

export function bearerToken(header: string | undefined): string | undefined {
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined
}

/** Every /api route except sign-in needs a signed-in staff member. */
export const requireStaff: MiddlewareHandler = async (c, next) => {
  const staff = staffForToken(bearerToken(c.req.header('Authorization')))
  if (!staff) return c.json({ error: 'Please sign in again.' }, 401)
  setCurrentStaff(staff)
  await next()
}

export function requireRole(...roles: Role[]): MiddlewareHandler {
  return async (_c, next) => {
    if (!roles.includes(currentStaff().role)) {
      throw new ApiError(403, 'Only the owner or the store manager can do that.')
    }
    await next()
  }
}
