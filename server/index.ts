import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { existsSync, readFileSync } from 'node:fs'
import { createApi } from './app.ts'
import { openDb } from './db.ts'
import { seedDemo } from './seed.ts'

const port = Number(process.env.PORT ?? 5116)
const dbPath = process.env.STOCKPILE_DB_PATH ?? './data/stockpile.sqlite'
const db = openDb(dbPath)

const empty = (db.prepare('SELECT COUNT(*) AS n FROM staff').get() as { n: number }).n === 0
if (empty || process.env.STOCKPILE_RESEED === '1') {
  seedDemo(db)
  console.log('Seeded demo data')
}

const app = new Hono()
app.route('/api', createApi(db))

// In production the built web app is served from the same port.
if (existsSync('./dist/index.html')) {
  const indexHtml = readFileSync('./dist/index.html', 'utf8')
  app.use('/assets/*', serveStatic({ root: './dist' }))
  app.use('/favicon.svg', serveStatic({ path: './dist/favicon.svg' }))
  app.get('*', (c) => c.html(indexHtml))
}

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Stockpile listening on http://localhost:${info.port}`)
})
