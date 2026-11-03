export type Role = 'owner' | 'manager' | 'counter'
export type PaymentMethod = 'cash' | 'transfer' | 'pos'

export interface Staff {
  id: number
  name: string
  role: Role
}

export interface Product {
  id: number
  sku: string
  name: string
  category: string
  priceKobo: number
  reorderLevel: number
  stockOnHand: number
}

export interface CounterProduct extends Product {
  sellable: number
}

export interface Batch {
  id: number
  batchNo: string
  expiryDate: string
  qtyReceived: number
  qtyRemaining: number
  costKobo: number
  receivedAt: string
  receivedBy: string | null
  untouched: boolean
}

export interface ProductDetail extends Product {
  batches: Batch[]
  sellable: number
}

export interface ProductPage {
  items: Product[]
  total: number
  nextOffset: number | null
}

export interface SaleSummary {
  id: number
  receiptNo: string
  createdAt: string
  paymentMethod: PaymentMethod
  totalKobo: number
  cashier: string
  itemCount: number
  voidedAt: string | null
  voidedBy: string | null
}

export interface Sale extends Omit<SaleSummary, 'itemCount'> {
  lines: { product: string; sku: string; qty: number; unitPriceKobo: number; lineTotalKobo: number }[]
}

export interface ExpiringBatch {
  batchId: number
  batchNo: string
  expiryDate: string
  qtyRemaining: number
  productId: number
  name: string
  sku: string
}

export interface Alerts {
  today: string
  expiryWarningDays: number
  lowStock: (Pick<Product, 'id' | 'sku' | 'name' | 'category' | 'stockOnHand' | 'reorderLevel'>)[]
  expiringSoon: ExpiringBatch[]
  expired: ExpiringBatch[]
}

export interface DailyReport {
  date: string
  salesCount: number
  totalKobo: number
  itemsSold: number
  byMethod: { method: PaymentMethod; count: number; totalKobo: number }[]
  byCashier: { cashier: string; count: number; totalKobo: number }[]
  byCategory: { category: string; qty: number; totalKobo: number }[]
  topItems: { name: string; qty: number; totalKobo: number }[]
}

export interface Adjustment {
  id: number
  createdAt: string
  delta: number
  reason: string
  note: string
  product: string
  batchNo: string
  staff: string
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  transfer: 'Transfer',
  pos: 'POS',
}
