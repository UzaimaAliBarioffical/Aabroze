The existing AABROZE storefront now has an integrated COD shopping flow. The logo, colours, typography, header, footer, homepage and collections remain in place. Live deployment still requires Supabase and SMTP configuration; no real email delivery has been verified.

1. Existing functionality reused

   App Router pages, product loaders, product/variant/image tables, size pricing rules, VariantSelectModal, CartContext, cart drawer, checkout inputs, Supabase clients, order/item/payment tables, Zod validation, Nodemailer, toasts and optional WhatsApp notifications.

2. Functionality completed

   Size-specific pricing and stock limits work in product cards, product details and quick view. The cart validates stored data, merges the same size, preserves different sizes, survives refresh, supports quantities/removal/clear, and shows shipping and totals. Buy Now uses a separate session selection and leaves the bag untouched.

   Checkout collects customer/address information for Pakistan and accepts COD. The existing `whatsapp`/`customer_whatsapp` fields store the optional alternate phone, avoiding a duplicate column. A submission lock prevents double clicks. Pending submissions persist in sessionStorage; after a lost response, refreshing and retrying uses the same details and idempotency key. Only purchased cart quantities are removed after confirmed success. Confirmation and the authoritative total survive a refresh in the same browser tab.

   One service-only database transaction locks variants, verifies availability, reads current database prices, saves the order/items/unpaid payment, reduces stock and enqueues owner/customer emails. Failure rolls the entire transaction back. A request fingerprint prevents a reused key from silently accepting different details. Public insert policies that bypassed checkout have been removed, and profile updates cannot grant the customer admin privileges.

   Emails use the requested subjects, escaped HTML and text alternatives, all customer/order details, and COD wording. Each recipient has an independent durable job. SMTP failures leave the order saved and return checkout success. A leased retry worker skips sent jobs and applies exponential backoff. SMTP is at-least-once: a crash after provider acceptance but before saving delivery status can cause a duplicate email; stable Message-IDs help but cannot guarantee provider deduplication. Order creation remains idempotent.

3. Files changed

   Storefront: `app/(store)/cart/page.tsx`, `app/(store)/checkout/page.tsx`, `app/(store)/shop/[slug]/ProductDetailClient.tsx`, `context/CartContext.tsx`, `components/store/ProductCard.tsx`, `VariantSelectModal.tsx`, `QuickView.tsx`, `CartDrawer.tsx`, `AnnouncementBar.tsx`. `Header.tsx` reduces navigation spacing on tablets to keep the cart icon within the screen. `SizeGuide.tsx` only escapes existing inch marks for lint.

   Server/shared: `app/api/orders/route.ts`, new `app/api/orders/retry-emails/route.ts`, `lib/create-order.ts`, `lib/email.ts`, new `lib/order-emails.ts`, new `lib/cart.ts`, `lib/pricing.ts` reused unchanged, `lib/utils.ts`, `lib/zod-schemas.ts`, `lib/supabase/admin.ts`, `types/index.ts`.

   Setup/tests: `.env.example`, `.gitignore`, `.eslintrc.json`, `package.json`, `package-lock.json`, `playwright.config.cjs`, `tests/`, this report, and migration `003_atomic_checkout.sql`. Added development-only PGlite and Playwright dependencies.

4. Database migration

   Apply `supabase/migrations/003_atomic_checkout.sql` in the Supabase SQL editor after migrations 001 and 002. It reuses the existing commerce tables, adds `orders.request_fingerprint`, creates the required email-job table and two service-only RPCs, and updates access policies. Apply the migration before deploying the updated order API.

   Existing products receive missing S/M/L/XL variants at zero stock; existing Small/Medium/Large aliases, prices and stock are preserved. Set genuine stock and optional per-size prices in `product_variants`. For newly created products, configure S/M/L/XL variants in that same table; unset or zero-stock sizes cannot be purchased. A null variant price falls back to the product sale price, then its regular price.

5. Environment variables

   Copy `.env.example` to `.env.local` for local use, or configure the hosting platform's environment. Required for checkout: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Set `NEXT_PUBLIC_APP_URL` to the storefront URL.

   Shipping: `NEXT_PUBLIC_DELIVERY_CHARGE=200`, `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=0` (disabled). Set a positive threshold to enable free shipping. Rebuild after changing either value so the server and browser use the same settings. These settings replace the old province-specific charges and hardcoded threshold. A custom announcement must be updated separately if it advertises shipping terms.

   Email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`; set `ORDER_NOTIFICATION_EMAIL=aabroze.pk@gmail.com` (the built-in fallback). `STORE_OWNER_EMAIL` remains a fallback for existing deployments. Set a long random server-only `ORDER_EMAIL_RETRY_SECRET` for the worker endpoint. Service-role, SMTP and retry secrets must never have a `NEXT_PUBLIC_` prefix.

6. SMTP and retry setup

   For Gmail, enable 2-Step Verification and create an App Password for the sending account. Set `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`, `EMAIL_USER` to that account, `EMAIL_PASS` to the App Password and `EMAIL_FROM=AABROZE <sending-account@gmail.com>`. Port 587 requires STARTTLS; port 465 uses implicit TLS. Use an authorized sender when using another SMTP provider. See Google's [App Password instructions](https://support.google.com/accounts/answer/185833?hl=en) and [SMTP settings](https://support.google.com/mail/answer/7104828?hl=en).

   Configure a trusted scheduler to POST `/api/orders/retry-emails` every minute with `Authorization: Bearer <ORDER_EMAIL_RETRY_SECRET>`. Each call claims up to ten due jobs. The endpoint is not public and does not create orders. Initial delivery runs after the successful order response; the scheduler recovers failures or interrupted workers. Monitor `order_email_jobs.sent_at`, `attempts`, `next_attempt_at` and `last_error` in Supabase. Do not insert another order to resend an email.

   Place a controlled real order with a recipient you own, verify the order and items in Supabase, confirm both inboxes receive the email, and verify COD is unpaid. Provider acceptance alone is not proof of inbox delivery. This live test has not been performed because credentials were not present.

7. Validation

   `npm run typecheck`, `npm run lint`, and `npm run build` passed. The production build required network access for the site's existing Google font download. Existing product-loader logs mention dynamic rendering during static probing; the build completed and those storefront routes are dynamic.

   `npm test`: four passing test groups cover customer/cart validation, size-price precedence, stock caps, purchased-quantity removal, actual SQL migrations, authoritative pricing, idempotent replay, atomic rollback, unavailable stock, shipping, restricted RPC access, HTML escaping, missing SMTP, leased jobs, and retrying only a failed recipient.

   `npm run test:e2e`: five passing Chrome journeys cover listing/product → size → cart, merging and refresh, tablet cart layout, quantity/removal/clear, invalid form inputs, duplicate submit events, order persistence despite SMTP failure, mobile Buy Now isolation, success refresh, a lost response followed by retry, competing requests for limited stock, rejected unavailable quantities, ignored client prices, and unauthorized retry access. The mobile checkout screenshot was visually inspected.

   The browser tests run the production Next.js build against a local PostgREST-compatible fixture backed by PGlite and the actual migrations. They do not contact hosted Supabase or send external email. SMTP success in the worker test is simulated. Multi-connection load testing on hosted PostgreSQL and real inbox delivery remain deployment checks. Run `npm run build` before browser tests; Chrome must be installed (or change the Playwright channel).

8. Remaining manual setup

   Apply migration 003 to the live project, supply the environment values, set actual product stock/prices, deploy, schedule email retries, and perform the real Supabase/inbox delivery test. Orders remain visible in the Supabase `orders` and `order_items` tables even when SMTP fails. This checkout task does not add a new admin dashboard.

Implementation references: [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after) and [PostgreSQL locking](https://www.postgresql.org/docs/17/explicit-locking.html).

Windows / OneDrive startup: `scripts/prepare-next-cache.cjs` runs before npm dev/build/start. On Windows projects inside OneDrive, it creates a `.next` directory junction to a project-specific cache under `%LOCALAPPDATA%\Aabroze\next-cache`. This keeps generated files away from OneDrive cloud reparse points that can cause `EINVAL: readlink`. Source files stay in the project. Other systems keep the normal `.next` directory. If an old ordinary `.next` folder exists, stop Next.js and remove only that generated folder once, then run `npm run build`. The hook intentionally refuses to overwrite an existing folder or a link to a different target.
