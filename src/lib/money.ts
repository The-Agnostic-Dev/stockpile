const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })

/** 1250050 -> "₦12,500.50" */
export function formatNaira(kobo: number): string {
  return naira.format(kobo / 100)
}

/** What a person typed in a price box ("12,500", "₦850.50") to kobo, or null if it is not a price. */
export function nairaToKobo(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Math.trunc(Number(cleaned) * 100)
}

/** Kobo to the plain number shown in an editable price box. */
export function koboToInput(kobo: number): string {
  return kobo % 100 === 0 ? String(kobo / 100) : (kobo / 100).toFixed(2)
}

/** Sum of each line's unit price × quantity, in kobo. */
export function cartTotalKobo(lines: { priceKobo: number; qty: number }[]): number {
  return lines.reduce((total, line) => total + line.priceKobo * line.qty, 0)
}
