# Local AABROZE setup

For the completed order/admin flow and migration 004, see `ORDER-SYSTEM-CHECK.md`.

The existing storefront and database schema are preserved. Live catalog data and
orders require credentials for the **existing** Supabase project. Local product
images are previews; they do not replace database products or invent prices.

## Configure credentials

Create `.env.local` in the project root if it does not exist. If it already exists,
edit only the missing settings. Use `.env.example` as a list of supported names;
do not overwrite an existing environment file or commit credentials.

Set these values from the existing project's Supabase dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`: the project URL from the project's Connect dialog or API settings.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the project's legacy `anon` public API key from Settings > API Keys.
- `SUPABASE_SERVICE_ROLE_KEY`: the matching legacy `service_role` key, used only by server-side order operations. Never give it a `NEXT_PUBLIC_` prefix.

Supabase client guidance: https://supabase.com/docs/guides/auth/server-side/creating-a-client

For order notification emails, set `EMAIL_USER` and `EMAIL_PASS` to the actual SMTP
account and app password. The existing defaults use Gmail with `EMAIL_HOST=smtp.gmail.com`
and `EMAIL_PORT=587`. Set `EMAIL_FROM` to an authorized sender if needed. Existing
owner notification defaults remain unchanged. Email failures retain queued jobs;
they do not cancel saved orders. Set `ORDER_EMAIL_RETRY_SECRET` to your own random
server-only token if using the protected `/api/orders/retry-emails` endpoint.

For local links, set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

Restart development after editing environment variables. Rebuild production after
changing public variables because Next.js embeds them in browser bundles.

## Run and verify

On this Windows machine use `npm.cmd` because PowerShell blocks `npm.ps1`:

```powershell
npm.cmd run build
npm.cmd run dev
```

Stop development before building: both commands use `.next`. The lifecycle script
keeps generated files in a local AppData cache outside OneDrive and links its parent
to this project's `node_modules`. Do not remove application or environment files
to repair a generated cache.

Visit `/`, `/shop`, `/new-arrivals`, `/collections`, an existing published product's
`/shop/<slug>`, `/cart`, and `/checkout`. Once credentials are configured, confirm
published, non-archived products and their existing variants/prices appear. The
queries match the checked-in schema and its public read policies. If the hosted
schema differs, inspect it before changing anything. Do **not** blindly rerun
`001_initial_schema.sql`: it includes seed data. Checkout requires the existing
`place_store_order` RPC and email queue from migration `003_atomic_checkout.sql`;
verify migration history before applying any missing migration.

Without credentials, the homepage and local assets still render, but live product
detail/category pages cannot load and checkout cannot save an order. The API returns
503 for missing order configuration and preserves the browser's bag. No keys are
invented and no database is substituted.

The video uses `public/videos/coming soon.mp4`. Its poster is a frame extracted from
that same existing video at one second, saved as `public/brand/video-poster.jpg`.
The banner layout and styling are unchanged.
