import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { api } from '../api/client'
import type { Staff } from '../api/types'
import { Notice } from '../components/Notice'
import { useAuth } from '../state/AuthContext'

export function Login() {
  const { staff, signIn } = useAuth()
  const [people, setPeople] = useState<Staff[]>([])
  const [staffId, setStaffId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api<Staff[]>('/staff').then(setPeople, (err: Error) => setError(err.message))
  }, [])

  if (staff) return <Navigate to="/" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await signIn(Number(staffId), pin)
    } catch (err) {
      setError((err as Error).message)
      setPin('')
    }
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <h1>Stockpile</h1>
        <p className="muted">Mama Ngozi Pharmacy &amp; Provisions</p>
        <label>
          Who is on duty?
          <select name="staff" value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
            <option value="">Choose your name</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          PIN
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </label>
        <Notice>{error}</Notice>
        <button type="submit">Sign in</button>
      </form>
    </div>
  )
}
