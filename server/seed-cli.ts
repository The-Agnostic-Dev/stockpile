import { openDb } from './db.ts'
import { seedDemo } from './seed.ts'

const db = openDb(process.env.STOCKPILE_DB_PATH ?? './data/stockpile.sqlite')
seedDemo(db)
console.log('Demo data reloaded')
