import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setUnauthorisedHandler, tokenStore } from '../api/client'
import type { Staff } from '../api/types'

interface AuthState {
  staff: Staff | null
  ready: boolean
  signIn: (staffId: number, pin: string) => Promise<void>
  signOut: () => Promise<void>
  canManage: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setUnauthorisedHandler(() => {
      tokenStore.clear()
      setStaff(null)
    })
    if (!tokenStore.get()) {
      setReady(true)
      return
    }
    api<Staff>('/auth/me')
      .then(setStaff)
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true))
  }, [])

  const signIn = useCallback(async (staffId: number, pin: string) => {
    const session = await api<{ token: string; staff: Staff }>('/auth/login', { method: 'POST', json: { staffId, pin } })
    tokenStore.set(session.token)
    setStaff(session.staff)
  }, [])

  const signOut = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    tokenStore.clear()
    setStaff(null)
  }, [])

  const value = useMemo(
    () => ({ staff, ready, signIn, signOut, canManage: staff?.role === 'owner' || staff?.role === 'manager' }),
    [staff, ready, signIn, signOut],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
