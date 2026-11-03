import { useState, type FormEvent } from 'react'
import type { Product } from '../api/types'
import { koboToInput, nairaToKobo } from '../lib/money'
import { Notice } from './Notice'

export const CATEGORIES = [
  'Medicines',
  'Vitamins & supplements',
  'First aid',
  'Personal care',
  'Baby care',
  'Provisions',
  'Drinks',
]

export interface ProductFormValues {
  sku: string
  name: string
  category: string
  priceKobo: number
  reorderLevel: number
}

interface Props {
  initial?: Product
  submitLabel: string
  onSubmit: (values: ProductFormValues) => Promise<void>
  onCancel?: () => void
}

export function ProductForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0])
  const [price, setPrice] = useState(initial ? koboToInput(initial.priceKobo) : '')
  const [reorderLevel, setReorderLevel] = useState(String(initial?.reorderLevel ?? 5))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const priceKobo = nairaToKobo(price)
    if (priceKobo === null) {
      setError('Enter the selling price in naira, for example 1500 or 1,250.50.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({ sku, name, category, priceKobo, reorderLevel: Number(reorderLevel) })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label>
        Name
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        SKU
        <input name="sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
      </label>
      <label>
        Category
        <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Selling price (₦)
        <input name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </label>
      <label>
        Reorder level
        <input
          name="reorderLevel"
          type="number"
          min={0}
          value={reorderLevel}
          onChange={(e) => setReorderLevel(e.target.value)}
        />
        <small>Warn me when stock gets down to this many.</small>
      </label>
      <Notice>{error}</Notice>
      <div className="actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
