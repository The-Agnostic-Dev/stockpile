import { useState, type FormEvent } from 'react'
import { nairaToKobo } from '../lib/money'
import { Notice } from './Notice'

export interface ReceiveValues {
  batchNo: string
  expiryDate: string
  qty: number
  costKobo: number
}

export function ReceiveStockForm({ onSubmit }: { onSubmit: (values: ReceiveValues) => Promise<void> }) {
  const [batchNo, setBatchNo] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [qty, setQty] = useState('')
  const [cost, setCost] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const costKobo = cost.trim() === '' ? 0 : nairaToKobo(cost)
    if (costKobo === null) {
      setError('Enter the cost price in naira, or leave it empty.')
      return
    }
    setError('')
    setSaved('')
    try {
      await onSubmit({ batchNo, expiryDate, qty: Number(qty), costKobo })
      setSaved(`Received ${qty} from batch ${batchNo}.`)
      setBatchNo('')
      setExpiryDate('')
      setQty('')
      setCost('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <form className="form-grid" onSubmit={submit} aria-label="Receive stock">
      <label>
        Batch number
        <input name="batchNo" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} required />
      </label>
      <label>
        Expiry date
        <input name="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
      </label>
      <label>
        Quantity received
        <input name="qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} required />
      </label>
      <label>
        Cost price per unit (₦)
        <input name="cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
      </label>
      <Notice>{error}</Notice>
      <Notice kind="success">{saved}</Notice>
      <div className="actions">
        <button type="submit">Receive stock</button>
      </div>
    </form>
  )
}
