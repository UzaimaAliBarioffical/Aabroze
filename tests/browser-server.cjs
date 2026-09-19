// Local PostgREST-compatible test boundary backed by the actual PostgreSQL migrations.
// No hosted Supabase or external SMTP is used by this fixture.
const http = require('node:http')
const { spawn } = require('node:child_process')
const { createDatabase, seed } = require('./database.cjs')

async function main() {
  const db = await createDatabase()
  await seed(db)
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1:3111')
    const send = (body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
    try {
      let text = ''
      for await (const chunk of req) text += chunk
      const body = text ? JSON.parse(text) : {}
      const eq = (name) => url.searchParams.get(name)?.replace(/^eq\./, '')
      if (url.pathname === '/__state') {
        return send({ orders: (await db.query('select * from orders')).rows, jobs: (await db.query('select * from order_email_jobs')).rows })
      }
      if (url.pathname === '/__reset') {
        await db.exec('truncate orders cascade; update product_variants set stock = case when size = \'L\' then 0 else 5 end;')
        return send({ success: true })
      }
      if (url.pathname === '/auth/v1/user') return send({ message: 'No session' }, 401)
      if (url.pathname === '/rest/v1/products') {
        const products = (await db.query('select * from products')).rows
        for (const product of products) {
          product.variants = (await db.query('select * from product_variants where product_id=$1', [product.id])).rows
          product.images = []
        }
        const filtered = eq('slug') ? products.filter((p) => p.slug === eq('slug')) : products
        return send(req.headers.accept?.includes('vnd.pgrst.object') ? filtered[0] : filtered)
      }
      if (url.pathname === '/rest/v1/categories' || url.pathname === '/rest/v1/site_settings') return send([])
      if (url.pathname === '/rest/v1/rpc/place_store_order') {
        const result = await db.query('select place_store_order($1::jsonb,$2::jsonb,$3,$4,$5,$6) as result',
          [JSON.stringify(body.p_customer),JSON.stringify(body.p_items),body.p_user_id,body.p_fingerprint,body.p_shipping,body.p_free_threshold])
        return send(result.rows[0].result)
      }
      if (url.pathname === '/rest/v1/rpc/claim_order_emails') {
        return send((await db.query('select * from claim_order_emails($1)', [body.p_order_id])).rows)
      }
      if (url.pathname === '/rest/v1/orders') {
        const order = (await db.query('select * from orders where id=$1', [eq('id')])).rows[0]
        if (order) order.items = (await db.query('select * from order_items where order_id=$1', [order.id])).rows
        return send(order)
      }
      if (url.pathname === '/rest/v1/order_email_jobs' && req.method === 'PATCH') {
        await db.query('update order_email_jobs set sent_at=$1,last_error=$2,locked_until=$3,lease_token=$4,next_attempt_at=$5 where id=$6 and lease_token=$7',
          [body.sent_at,body.last_error,body.locked_until,body.lease_token,body.next_attempt_at,eq('id'),eq('lease_token')])
        return send(null)
      }
      send({ message: 'Unhandled local test route' }, 404)
    } catch (error) { send({ code: error.code, message: error.message }, 400) }
  })
  await new Promise((resolve) => server.listen(3111, '127.0.0.1', resolve))
  const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3110'], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3111', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-test-anon',
      SUPABASE_SERVICE_ROLE_KEY: 'local-test-service', EMAIL_USER: '', EMAIL_PASS: '', WHATSAPP_TOKEN: '', ORDER_EMAIL_RETRY_SECRET: 'local-test-retry' },
  })
  const stop = () => { app.kill(); server.close(); db.close().finally(() => process.exit()) }
  process.on('SIGTERM', stop); process.on('SIGINT', stop)
  app.on('exit', () => { server.close(); db.close().finally(() => process.exit()) })
}
main().catch((error) => { console.error(error); process.exit(1) })
