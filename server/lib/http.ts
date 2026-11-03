import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

/** An error with a message that is safe to show at the counter. */
export class ApiError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    message: string,
  ) {
    super(message)
  }
}

export const badRequest = (message: string) => new ApiError(400, message)
export const notFound = (message = 'Not found.') => new ApiError(404, message)
export const conflict = (message: string) => new ApiError(409, message)

export function handleError(err: Error, c: Context) {
  if (err instanceof ApiError) return c.json({ error: err.message }, err.status)
  console.error(err)
  return c.json({ error: 'Something went wrong. Please try again.' }, 500)
}

export function toInt(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof n === 'number' && Number.isInteger(n) ? n : null
}
