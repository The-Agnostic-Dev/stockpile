import type { DB } from '../db.ts'
import { shopDayRange } from '../lib/dates.ts'

export interface DailyReport {
  date: string
  salesCount: number
  totalKobo: number
  itemsSold: number
  byMethod: { method: string; count: number; totalKobo: number }[]
  byCashier: { cashier: string; count: number; totalKobo: number }[]
  byCategory: { category: string; qty: number; totalKobo: number }[]
  topItems: { name: string; qty: number; totalKobo: number }[]
}

/** Takings for one shop day. Voided sales are left out. */
export function dailyReport(db: DB, date: string): DailyReport {
  const [from, to] = shopDayRange(date)
  const daySales = `SELECT * FROM sales WHERE voided_at IS NULL AND created_at >= @from AND created_at < @to`
  const totals = db
    .prepare(`SELECT COUNT(*) AS salesCount, COALESCE(SUM(total_kobo), 0) AS totalKobo FROM (${daySales})`)
    .get({ from, to }) as { salesCount: number; totalKobo: number }
  const byMethod = db
    .prepare(
      `SELECT payment_method AS method, COUNT(*) AS count, SUM(total_kobo) AS totalKobo
       FROM (${daySales}) GROUP BY payment_method ORDER BY totalKobo DESC`,
    )
    .all({ from, to }) as DailyReport['byMethod']
  const byCashier = db
    .prepare(
      `SELECT st.name AS cashier, COUNT(*) AS count, SUM(s.total_kobo) AS totalKobo
       FROM (${daySales}) s JOIN staff st ON st.id = s.cashier_id
       GROUP BY st.id ORDER BY totalKobo DESC`,
    )
    .all({ from, to }) as DailyReport['byCashier']
  const lines = `SELECT l.*, p.name, p.category FROM sale_lines l
    JOIN (${daySales}) s ON s.id = l.sale_id JOIN products p ON p.id = l.product_id`
  const byCategory = db
    .prepare(
      `SELECT category, SUM(qty) AS qty, SUM(line_total_kobo) AS totalKobo
       FROM (${lines}) GROUP BY category ORDER BY totalKobo DESC`,
    )
    .all({ from, to }) as DailyReport['byCategory']
  const topItems = db
    .prepare(
      `SELECT name, SUM(qty) AS qty, SUM(line_total_kobo) AS totalKobo
       FROM (${lines}) GROUP BY product_id ORDER BY qty DESC, totalKobo DESC LIMIT 10`,
    )
    .all({ from, to }) as DailyReport['topItems']
  const itemsSold = byCategory.reduce((n, row) => n + row.qty, 0)
  return { date, ...totals, itemsSold, byMethod, byCashier, byCategory, topItems }
}
