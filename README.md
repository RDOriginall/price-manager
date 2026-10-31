# Price Manager

An offline-first price and inventory manager for small shops that price products in foreign currencies (USD, AED, EUR, CNY) and sell in Toman. Everything runs in the browser and works without an internet connection once installed as a PWA. Built mobile-first with a Persian (RTL) interface.

<!-- Add 2–3 phone screenshots here: products, add product, sales -->
<!-- ![Products](docs/products.png) -->

## Features

- **Products and stock:** name, code, foreign-currency price, stock quantity, and per-product price multiplier
- **Manual exchange rates** per currency, with the Toman price calculated automatically
- **Bulk price adjustment** (increase or decrease all prices by a percentage)
- **Sales recording** that decreases stock and keeps a sales history
- **Search** by product name or code
- **Excel export** of the sales history
- **JSON backup and restore** of all data
- **Installable PWA** that works fully offline, with persistent storage requested
- **Tab-based, mobile-first UI** (bottom tab bar on phones, top tabs on desktop)

## How it works offline

- A service worker (via `vite-plugin-pwa` / Workbox) precaches the app shell, including the bundled Persian font, so the app opens with no network after the first visit.
- Data lives in IndexedDB through [Dexie](https://dexie.org). Nothing is sent to a server.
- The app asks the browser for persistent storage (`navigator.storage.persist()`) so data is less likely to be evicted.
- Because data is local to one device, the backup/restore feature is the way to move or protect it.

## Technical decisions

- **Money is stored as integers** in minor units (for example, USD 12.50 is stored as `1250`) to avoid floating-point errors. Price multipliers are stored as basis points.
- **Sales snapshot the price at sale time** (product name, code, price, multiplier), so later price changes never rewrite history.
- **A sale is one Dexie transaction:** the sale record and the stock decrease succeed or fail together.
- **Versioned database schema** with Dexie migrations.
- **Tailwind CSS v4** with a small token set in `@theme`; the font is bundled (no CDN) so styling also works offline.

## Tech stack

React 19 · TypeScript · Vite · Dexie (IndexedDB) · Tailwind CSS v4 · vite-plugin-pwa · ExcelJS · oxlint

## Getting started

```bash
npm install
npm run dev        # development server
npm run build      # type-check and production build
npm run preview    # serve the production build (needed to test the service worker)
```

To test offline behavior, run `npm run build && npm run preview`, open the page, then use DevTools → Application → Service Workers → Offline. Installing on a phone requires HTTPS.

## Project structure

```
src/
  db/        Dexie database and repositories (products, sales, exchange rates)
  data/      supported currencies
  types/     TypeScript models
  utils/     Excel export and JSON backup/restore
  App.tsx    UI
```

## Roadmap

- Split `App.tsx` into feature components and hooks
- Unit tests for price conversion, sales, and backup/restore
- Demo data loader

## License

Source is published for viewing and evaluation. See [LICENSE](LICENSE).

---

## فارسی

**Price Manager** یک اپ مدیریت قیمت و موجودی برای فروشگاه‌های کوچکه که قیمت محصولات را با ارز (دلار، درهم، یورو، یوان) ثبت می‌کنند و به تومان می‌فروشند. کل برنامه داخل مرورگر اجرا می‌شود و بعد از نصب به‌صورت PWA بدون اینترنت هم کار می‌کند. رابط کاربری فارسی (راست‌به‌چپ) و اولویت طراحی با موبایل است.

**امکانات:** ثبت محصول و موجودی، نرخ ارز دستی و محاسبه‌ی خودکار قیمت تومانی، افزایش یا کاهش کلی قیمت‌ها، ثبت فروش و تاریخچه‌ی فروش، جست‌وجو، خروجی Excel، بک‌آپ و بازیابی JSON، و رابط تب‌محور مخصوص موبایل.

**نکات فنی:** مبالغ به‌صورت عدد صحیح (واحد کوچک ارز) ذخیره می‌شوند نه اعشاری؛ هر فروش قیمت لحظه‌ی فروش را ثبت می‌کند؛ ثبت فروش و کم‌شدن موجودی در یک تراکنش Dexie انجام می‌شود؛ و داده‌ها فقط روی همین دستگاه (IndexedDB) می‌مانند، پس بک‌آپ‌گیری منظم لازم است.

**اجرا:** `npm install` و بعد `npm run dev`.
