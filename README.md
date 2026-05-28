# Finance Tracker

Personal finance PWA to track income, spending, and savings. Built with **Next.js**, **Supabase**, and installable on your phone as a progressive web app.

## Features (v1)

- Email/password sign-in (only your data via Row Level Security)
- **Accounts** with starting balances
- **Income** — log earnings with optional pay stub upload (PDF or image)
- **Expenditures** — log spending with category tags and optional receipt upload
- **Dashboard** — money-pool donut (spent, goal set-aside, remaining), monthly summary, top categories
- **AI Budget Coach** — suggests monthly budget adjustments and rule-based plans (50/30/20, 60/20/20, zero-based)
- **Savings goals** — piggybank-style targets with monthly auto set-aside and manual deposits
- **PWA** — add to home screen on mobile or desktop

## Prerequisites

1. [Node.js 20+](https://nodejs.org/) (includes `npm`)
2. A free [Supabase](https://supabase.com) project

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run all migration files (in order):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_savings_goals.sql`
   - `supabase/migrations/003_transaction_attachments.sql`
   - `supabase/migrations/004_optional_account.sql`
   - `supabase/migrations/005_default_currency_php.sql`
   - `supabase/migrations/006_goal_status.sql`
   - `supabase/migrations/007_fixed_expenses.sql`
   - `supabase/migrations/008_goal_piggybank.sql`
3. In **Authentication → Providers**, ensure **Email** is enabled.
4. For solo use, you can disable email confirmation under **Authentication → Settings** (optional, speeds up first login).
5. Copy **Project URL** and **anon public key** from **Project Settings → API**.

### 3. Environment variables

Copy the example file and fill in your keys:

```bash
copy .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_API_KEY=your-google-ai-api-key
```

`GOOGLE_API_KEY` is optional. If omitted, Budget Coach runs in local rule-based mode.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create your account, add an account, then log transactions.

### 5. Install as PWA

**Production build required** (service worker is disabled in development):

```bash
npm run build
npm start
```

- **Chrome (Android/desktop):** menu → *Install app* / *Add to Home screen*
- **Safari (iOS):** Share → *Add to Home Screen*

Replace placeholder icons in `public/icons/` with your own `icon-192.png` and `icon-512.png` when ready.

## Deploy

Deploy to [Vercel](https://vercel.com):

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add the same `NEXT_PUBLIC_SUPABASE_*` environment variables.
4. In Supabase **Authentication → URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs**.

## Project structure

```
src/
  app/           # Pages (dashboard, transactions, accounts, login)
  components/    # UI and forms
  lib/           # Supabase clients, finance helpers, queries
supabase/
  migrations/    # Database schema + RLS
```

## Roadmap ideas

- Monthly budgets per category
- Recurring transactions
- CSV import
- Charts and year-over-year comparisons
