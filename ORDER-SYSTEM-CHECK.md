# AABROZE order system

The existing cart, Buy Now, size selection, price precedence, checkout form, COD
transaction, and independent owner/customer email queue are reused. The storefront,
logo, product data, and prices are unchanged.

## Completed admin integration

- `/admin/login`: Supabase password login, admin-role verification and sign out.
- `/admin/orders`: existing order table, status filtering and pagination.
- `/admin/orders/<id>`: customer/address/notes, purchased sizes/quantities/prices,
  totals, current payment status and owner/customer email delivery status.
- Authorized status transitions: pending → confirmed → packed → shipped → delivered.
  COD delivery requires confirmation that payment was received; the order and
  payment records update in one database transaction.
- Unpaid orders can be cancelled before shipping. Their reserved stock is restored
  once. Concurrent or stale updates are rejected. Legacy orders without the atomic
  checkout fingerprint require manual inventory review before cancellation.
- Every admin data loader and update action checks the authenticated user and role.
  The database mutation also checks the role. No service-role key reaches the browser.

Order notification emails still target `ORDER_NOTIFICATION_EMAIL`, defaulting to
`aabroze.pk@gmail.com`; customer confirmation targets the validated checkout email.
Delayed notifications now reflect the current status/payment rather than always
claiming the order is pending and unpaid. Sent email jobs are not sent again by a
status change. SMTP delivery is at-least-once; provider acceptance is not proof of
inbox delivery.

## Required live configuration

The local environment currently has no Supabase or SMTP credentials. Add the real
values to the existing project's `.env.local` (create it if absent; do not overwrite
an existing file):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EMAIL_USER` and `EMAIL_PASS` (SMTP account and app password)
- `ORDER_NOTIFICATION_EMAIL=aabroze.pk@gmail.com`
- `ORDER_EMAIL_RETRY_SECRET` (your own random server-only token)

Gmail defaults are `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`. Use an authorized
`EMAIL_FROM` if different from the sender account. Restart development after changing
the environment; rebuild production after changing public variables.

Check the existing Supabase migration history. After migrations 001–003 are already
present, apply only `supabase/migrations/004_admin_order_management.sql` to add the
admin update RPC. This new migration does not rewrite existing products, prices,
orders or stock. Do not rerun the initial schema/seed migration. No hosted migration
has been applied during this task.

Use an existing Supabase Auth account for administration. Its matching `public.profiles`
row must have `role = 'admin'`, assigned by the project owner in Supabase. If no admin
account exists, create the intended account in Authentication > Users and assign
only that user's profile the admin role. The website does not offer public admin registration.

For durable email retries, schedule an authenticated POST to `/api/orders/retry-emails`
every minute with `Authorization: Bearer <ORDER_EMAIL_RETRY_SECRET>`. Failed deliveries
remain queued independently of the saved order.

## Verification

Run `npm.cmd run build`, `npm.cmd test`, then `npm.cmd run test:e2e` on Windows.
The browser suite uses the production Next.js app with an isolated PGlite database
running the actual migrations. Supabase Auth/PostgREST and email transport are local
test fixtures. Outbound application fetches are restricted to loopback in this test
process; no live products, stock, orders or external inboxes are touched.

Browser scenarios cover cart merging, size-specific prices, refresh persistence,
complete checkout validation, COD order saving, owner/customer notifications, email
failure recovery, Buy Now isolation, lost-response retry, authoritative server prices,
stock rejection, admin login, customer access denial, fulfillment, collected COD
payment, cancellation/restock, filtering and logout.

Real Supabase saving and real inbox delivery remain unverified until credentials
and the hosted migration are configured. See also `LOCAL-SETUP.md`.

Authorization references: [Next.js authentication](https://nextjs.org/docs/app/guides/authentication)
and [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser).
