import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export type DB = Database.Database

const SCHEMA = `
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'counter')),
  pin TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_kobo INTEGER NOT NULL CHECK (price_kobo >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 0,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_no TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  qty_received INTEGER NOT NULL,
  qty_remaining INTEGER NOT NULL,
  cost_kobo INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL,
  received_by INTEGER REFERENCES staff(id)
);
CREATE INDEX IF NOT EXISTS batches_product ON batches(product_id, expiry_date);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL,
  cashier_id INTEGER NOT NULL REFERENCES staff(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'pos')),
  total_kobo INTEGER NOT NULL,
  voided_at TEXT,
  voided_by INTEGER REFERENCES staff(id)
);
CREATE INDEX IF NOT EXISTS sales_created ON sales(created_at);

CREATE TABLE IF NOT EXISTS sale_lines (
  id INTEGER PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  qty INTEGER NOT NULL,
  unit_price_kobo INTEGER NOT NULL,
  line_total_kobo INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS adjustments (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  staff_id INTEGER NOT NULL REFERENCES staff(id)
);
`

export function openDb(path: string): DB {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  return db
}

export function resetDb(db: DB) {
  db.exec(`
    DELETE FROM adjustments; DELETE FROM sale_lines; DELETE FROM sales;
    DELETE FROM batches; DELETE FROM products; DELETE FROM staff;
  `)
}
