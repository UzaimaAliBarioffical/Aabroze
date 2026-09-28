# Catalog diagnosis

The local `.env.local` currently has no Supabase URL, public key, server key, SMTP
username or SMTP password. `npm.cmd run check:catalog` reports names/status only,
then performs read-only catalog/schema checks when credentials become available.

The six visible images come from `lib/collection-images.ts`, not from database
product records. That file has no price, ID, size variants or inventory. Its slugs:

- lime-lilac-set
- teal-embroidered-kurta
- ochre-embroidered-kurta
- crimson-kurta-set
- mustard-paisley-set
- ivory-polka-dot-set

The checked-in initial SQL seed instead contains six different, unpublished
`[REPLACE]` sample products. Their sample prices are not prices for these photos.
No seed was published, rerun or mapped to the previews. Hosted catalog contents
cannot be established without access to the existing project.

## Configure the existing project

Edit the ignored `.env.local` in this project. Do not paste secrets into chat.

| Variable | Where to obtain the value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing Supabase project's **Connect** dialog: project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Settings > API Keys > Legacy anon, service_role API keys**: `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same existing project's legacy `service_role` key; server only |
| `EMAIL_USER` | The Gmail/SMTP account authorized to send store notifications |
| `EMAIL_PASS` | That account's Google **App password**, with 2-Step Verification enabled; not its normal login password |

Keep `ORDER_NOTIFICATION_EMAIL=aabroze.pk@gmail.com`. Gmail defaults are
`EMAIL_HOST=smtp.gmail.com` and `EMAIL_PORT=587`. If needed, `EMAIL_FROM` must be
an authorized sender. Set `ORDER_EMAIL_RETRY_SECRET` for the protected retry job.

References: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
and [Google App passwords](https://support.google.com/accounts/answer/185833?hl=en).

Restart Next.js after editing `.env.local`; rebuild deployed bundles after changing
public values. Use the existing project, not a new empty database.

## Verify real catalog records

In Supabase **Table Editor**, inspect `products`, `product_variants` and
`product_images`. Each real product needs its existing UUID, confirmed price,
`is_published=true`, and `is_archived=false`. Every size row must reference that
UUID through `product_variants.product_id`, have its own UUID, actual stock, and
the correct size label. S/M/L/XL are displayed; absent sizes remain unavailable.
`product_variants.price` overrides `products.sale_price`, then `products.price`.
Only use a null variant price when that size really uses the product-level price.

Published products and their variants/images need public SELECT policies. The
read-only diagnostic uses the public key so hidden rows/RLS issues are visible.
An empty result alone does not prove the database contains no products.

Storefront listings use actual published database records directly. Image previews
cannot be mapped by guesswork. If a photo belongs to a product with a different
slug, the owner must confirm that product ID; associate its real image through
`product_images.product_id`. Wishlist purchases now resolve by saved product ID
and remain valid if a product's slug changes.

Unknown product slugs no longer fall back to the first unrelated garment photo.
They use a neutral brand image until the real product image is linked. Primary
database images respect display order and exclude video records.

Check migration history before applying missing migrations. Checkout requires
the variant-price column from 002 and `place_store_order`, `claim_order_emails`,
and `order_email_jobs` from 003. Admin management uses 004. Do not rerun 001's
schema/sample seed against an existing catalog.

## Verification boundaries

`npm.cmd test` and `npm.cmd run test:e2e` exercise the actual checkout code and SQL
in isolated local test services. They do not populate the storefront database or
send real email. Hosted catalog matching, real order persistence and actual SMTP
delivery remain blocked until the above credentials and real catalog are available.
