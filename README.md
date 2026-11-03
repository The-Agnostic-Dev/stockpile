# Stockpile

Stock and sales for **Mama Ngozi Pharmacy & Provisions** (Surulere, Lagos): a neighbourhood pharmacy that also sells provisions and drinks.

Stockpile tracks:

- **Products** with a selling price and a reorder level.
- **Batches**: every delivery is received as a batch with its own batch number, expiry date and cost price.
- **The counter**: staff search the catalogue, build a cart and complete the sale (cash, transfer or POS). Stock is taken from the batch that expires first.
- **Sales**: every sale by day, with a printable receipt. The owner or store manager can void a sale rung up by mistake; the items go back into stock.
- **Stock adjustments**: damaged items, expired items taken off the shelf, count corrections, customer returns.
- **Alerts**: low stock, batches expiring soon, and expired batches still on the shelf.
- **Daily sales report**: takings for a day by payment method, by staff member, by category, and the best sellers.

All money is in naira (stored in kobo), and all days and times are Lagos time (Africa/Lagos).

## Stack

- React 19 + TypeScript single-page app (Vite, React Router)
- Node 22 JSON API with Hono, SQLite through better-sqlite3
- Vitest for tests

```
server/            API
  index.ts         starts the server (API under /api, built web app on the same port)
  app.ts           routes are mounted here
  routes/          HTTP handlers
  services/        business rules (sales, stock, products, alerts, reports, staff)
  lib/             dates (Lagos time), errors, request context
  seed.ts          demo data
src/               web app
  pages/           one file per screen
  components/      shared forms and layout
  state/           sign-in and the counter catalogue
  lib/             money, dates and search helpers
```

## Running it

With Docker (serves everything on http://localhost:5116 and reloads the demo data on every start):

```sh
docker compose up --build
```

Natively (Node 22 or newer):

```sh
npm install
npm run build        # builds the web app into dist/
npm start            # http://localhost:5116, creates and seeds ./data/stockpile.sqlite on first run
```

For development, `npm run dev` runs the API on port 5116 with reload and the Vite dev server on http://localhost:5173 (it proxies `/api` to the API).

`npm run seed` wipes the database and reloads the demo data. Setting `STOCKPILE_RESEED=1` does the same on every start. See `.env.example` for the other settings.

## Tests

```sh
npm test             # vitest
npm run typecheck    # tsc
```

## Demo logins

Pick your name on the sign-in screen and enter the PIN.

| Name | Role | PIN |
| --- | --- | --- |
| Ngozi Okeke | Owner (pharmacist) | 2580 |
| Tunde Bello | Store manager | 1357 |
| Bisi Adewale | Counter | 2468 |
| Musa Ibrahim | Counter | 1122 |

The demo data has 47 products, a week of sales (dates are relative to today) and a few batches that are expiring or already expired.

## How the shop works (rules built into Stockpile)

- **Who can do what.** Everyone can use the counter, look up products, see the sales list and the alerts. Only the owner and the store manager can add or edit products, receive stock, record adjustments, void sales and see the daily report. Those menu items are hidden for counter staff.
- **Expired stock cannot be sold.** A batch can be sold up to and including its expiry date. From the day after, the counter treats it as unavailable, even though the units are still counted under "On hand" on the Products page until someone takes them off the shelf and records an adjustment with the reason "Expired". This is why a product can show stock on the Products page but "Out of stock" at the counter. The product page shows both numbers: "On hand" and "Can be sold".
- **First expiry, first out.** The counter always sells from the batch with the earliest expiry date.
- **Low stock** lists products whose on-hand quantity is at or below their reorder level. A reorder level of 0 switches the warning off.
- **Expiring soon** lists batches that expire within the next 90 days (including today).
- **Voiding a sale.** Open the receipt (Sales, then the receipt number) and press "Void sale". The items go back into stock, the receipt is kept and marked void, and voided sales are not counted in the daily report.
- **Removing a batch** is only possible while nothing has been sold or adjusted from it (it is meant for deliveries entered by mistake). After that, use an adjustment.
- **The daily report** covers one Lagos calendar day, midnight to midnight.
