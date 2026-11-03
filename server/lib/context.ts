import type { Staff } from '../services/staff.ts'
import { ApiError } from './http.ts'

// Who is signed in for the request being handled. Set by the auth middleware
// so services can stamp sales, adjustments and stock receipts with a name.
let signedIn: Staff | null = null

export function setCurrentStaff(staff: Staff | null) {
  signedIn = staff
}

export function currentStaff(): Staff {
  if (!signedIn) throw new ApiError(401, 'Please sign in again.')
  return signedIn
}
