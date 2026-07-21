# LedgerOS Backend

## What this is
A local server (runs on your computer) that talks to your Supabase database.
Your frontend will call this server, and this server talks to Supabase — not the
other way around. This lets us safely calculate things like profit, stock costing,
etc. on the server instead of trusting the frontend.

## First-time setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the environment file and fill in your real Supabase details:
   ```
   cp .env.example .env
   ```
   Then open `.env` and paste in your Project URL, anon key, and service role key.
   Find these in: Supabase Dashboard → Project Settings → API.

3. Run the server:
   ```
   npm run dev
   ```
   You should see: `LedgerOS backend running at http://localhost:4000`

4. Test it's working — open this in your browser:
   ```
   http://localhost:4000/health
   ```
   You should see `{"status":"ok", ...}`

## Running the database setup (Supabase SQL Editor)
Run these files IN ORDER (each one builds on the last). Paste each into
Supabase SQL Editor and click Run, one at a time:
```
supabase/migrations/0001_init_auth_tenancy.sql
supabase/migrations/0002_inventory_costing.sql
supabase/migrations/0003_customers_suppliers.sql
supabase/migrations/0004_sales.sql
supabase/migrations/0005_cash_book.sql
supabase/migrations/0006_reports.sql
```

## All available routes
```
GET  /health                          - is the server alive?
GET  /me                              - who am I, what are my roles?

POST /products                        - add a product
GET  /products?shopId=                - list products
GET  /products/:id/stock              - current stock qty + value

POST /purchase-lots                   - record a stock purchase
GET  /purchase-lots?productId=        - purchase history

POST /sales                           - record a sale (runs costing engine)
GET  /sales?shopId=                   - list sales

POST /capital                         - record capital in/out
GET  /capital?shopId=

POST /transfers                       - move money cash <-> bank
GET  /transfers?shopId=

POST /expenses
GET  /expenses?shopId=

POST /customers
GET  /customers?shopId=
POST /customers/:id/debt              - record charge or payment
GET  /customers/:id/debt              - ledger + balance owed

POST /suppliers
GET  /suppliers?shopId=
POST /suppliers/:id/balance
GET  /suppliers/:id/balance

GET  /reports/cash-book?shopId=&start=&end=
GET  /reports/trading-account?shopId=&start=&end=
GET  /reports/profit-and-loss?shopId=&start=&end=
GET  /reports/balance-sheet?shopId=&asOf=
GET  /reports/inventory-aging?shopId=
GET  /reports/business/cash-book?businessId=&start=&end=
GET  /reports/business/profit-and-loss?businessId=&start=&end=
```
All routes except /health need:
```
Authorization: Bearer <the-user's-access-token>
```

## Folder structure
```
ledgeros-backend/
├── src/
│   ├── index.js          <- starts the server
│   ├── config/
│   │   └── supabaseClient.js   <- connects to Supabase
│   ├── middleware/
│   │   └── auth.js       <- checks the user is logged in
│   └── routes/
│       ├── health.js     <- /health  (is the server alive?)
│       └── me.js         <- /me      (who am I, what are my roles?)
├── supabase/
│   └── migrations/       <- the SQL files that set up your database
├── .env                  <- your real secrets (never commit this)
└── .env.example          <- template, safe to commit
```

## Testing /me (checking login works)
`/me` needs a real login token from Supabase Auth (from your frontend, after a
user signs in). Send it like this:
```
GET http://localhost:4000/me
Authorization: Bearer <the-user's-access-token>
```
