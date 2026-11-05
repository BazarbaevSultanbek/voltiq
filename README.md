# VOLTIQ — Phone & PC accessories store

Next.js 16 · TypeScript · Tailwind v4 · Motion · MongoDB (Mongoose) · Auth.js (Google, Apple, email) · Stripe · 6 languages (EN, RU, ZH, ES, FR, PT).

## Run locally
```bash
npm install
cp .env.example .env.local   # fill AUTH_SECRET + MONGODB_URI
npm run dev
```
The catalog seeds itself on first start. Admin: `/admin` (login/password from `ADMIN_LOGIN` / `ADMIN_PASSWORD`).

## Key features
- Home, search (live suggestions, filters, cross-language search), product, cart, checkout, order success, orders, profile, info pages
- Location popup on first visit (GPS or manual) → delivery prices & dates per country
- Prices = supplier cost + your margin (Admin → Settings, re-prices everything)
- Checkout accepts **only Visa, Mastercard, UnionPay** (enforced on server)
- In-app notifications on order + status changes; optional Telegram alert to owner
- Admin: revenue, orders (full JSON object + supplier link), users, search interests, products, AliExpress import, settings
- SEO: sitemap with hreflang, robots, JSON-LD (Product, OnlineStore, FAQ), per-page metadata

## Deploy (Vercel)
Import the GitHub repo in Vercel, add the env vars from `.env.example`, deploy.
