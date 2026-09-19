// Local PostgREST-compatible test boundary backed by the actual PostgreSQL migrations.
// No hosted Supabase or external SMTP is used by this fixture.
const http = require('node:http')
const { spawn } = require('node:child_process')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { createDatabase, seed } = require('./database.cjs')

async function main() {
  const db = await createDatabase()
  await seed(db)
  const users = [
    { id: randomUUID(), email: 'admin@example.com', role: 'admin' },
    { id: randomUUID(), email: 'customer-login@example.com', role: 'customer' },
  ]
  for (const user of users) {
    await db.query('insert into auth.users(id,email) values ($1,$2)', [user.id, user.email])
    await db.query('update profiles set role=$1 where id=$2', [user.role, user.id])
  }
  const sessions = new Map()
  let mails = []
  let smtpSuccess = false
  let emptyCatalog = false
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1:3111')
    const send = (body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
    try {
      let text = ''
      for await (const chunk of req) text += chunk
      const body = text ? JSON.parse(text) : {}
      const eq = (name) => url.searchParams.get(name)?.replace(/^eq\./, '')
      const token = req.headers.authorization?.replace(/^Bearer /, '')
      const session = sessions.get(token)
      const admin = session?.role === 'admin'
      if (url.pathname === '/__state') {
        return send({ orders: (await db.query('select * from orders')).rows, jobs: (await db.query('select * from order_email_jobs')).rows,
          payments: (await db.query('select * from payments')).rows, variants: (await db.query('select * from product_variants')).rows, mails })
      }
      if (url.pathname === '/__reset') {
        await db.exec('truncate orders cascade; update product_variants set stock = case when size = \'L\' then 0 else 5 end;')
        mails = []
        smtpSuccess = false
        emptyCatalog = false
        return send({ success: true })
      }
      if (url.pathname === '/__smtp') { smtpSuccess = body.success === true; return send({ success: true }) }
      if (url.pathname === '/__catalog') { emptyCatalog = body.empty === true; return send({ success: true }) }
      if (url.pathname === '/__mail') {
        if (!smtpSuccess) return send({ message: 'Simulated failure' }, 503)
        mails.push(body)
        return send({ success: true })
      }
      if (url.pathname === '/auth/v1/token') {
        const user = users.find(user => user.email === body.email)
        if (!user || body.password !== 'fixture-password') return send({ message: 'Invalid credentials' }, 400)
        const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
        const access_token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`
        sessions.set(access_token, user)
        return send({ access_token, refresh_token: randomUUID(), token_type: 'bearer', expires_in: 3600, user: { ...user, aud: 'authenticated', app_metadata: {}, user_metadata: {} } })
      }
      if (url.pathname === '/auth/v1/user') return session ? send({ ...session, aud: 'authenticated', app_metadata: {}, user_metadata: {} }) : send({ message: 'No session' }, 401)
      if (url.pathname === '/auth/v1/logout') { sessions.delete(token); return send({}) }
      if (url.pathname === '/rest/v1/profiles') return session && eq('id') === session.id ? send({ role: session.role }) : send(null, 403)
      if (url.pathname === '/rest/v1/products') {
        const products = emptyCatalog ? [] : (await db.query('select * from products where is_published and not is_archived')).rows
        for (const product of products) {
          product.variants = (await db.query('select * from product_variants where product_id=$1', [product.id])).rows
          product.images = []
        }
        let filtered = eq('slug') ? products.filter((p) => p.slug === eq('slug')) : products
        if (eq('category_id')) filtered = filtered.filter(p => p.category_id === eq('category_id'))
        if (eq('is_new_arrival')) filtered = filtered.filter(p => p.is_new_arrival)
        return send(req.headers.accept?.includes('vnd.pgrst.object') ? filtered[0] : filtered)
      }
      if (url.pathname === '/rest/v1/categories') return send((await db.query('select * from categories where is_active order by display_order')).rows)
      if (url.pathname === '/rest/v1/site_settings') return send([])
      if (url.pathname === '/rest/v1/rpc/place_store_order') {
        const result = await db.query('select place_store_order($1::jsonb,$2::jsonb,$3,$4,$5,$6) as result',
          [JSON.stringify(body.p_customer),JSON.stringify(body.p_items),body.p_user_id,body.p_fingerprint,body.p_shipping,body.p_free_threshold])
        return send(result.rows[0].result)
      }
      if (url.pathname === '/rest/v1/rpc/claim_order_emails') {
        return send((await db.query('select * from claim_order_emails($1)', [body.p_order_id])).rows)
      }
      if (url.pathname === '/rest/v1/rpc/update_admin_order') {
        if (!admin) return send({ message: 'Admin required' }, 403)
        const result = await db.transaction(async tx => {
          await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [session.id])
          return (await tx.query('select update_admin_order($1,$2,$3,$4) as result',
            [body.p_order_id,body.p_status,body.p_expected_status,body.p_payment_received])).rows[0].result
        })
        return send(result)
      }
      if (url.pathname === '/rest/v1/orders') {
        if (!admin && token !== 'local-test-service') return send({ message: 'Forbidden' }, 403)
        let orders = (await db.query('select * from orders order by created_at desc,id desc')).rows
        if (eq('id')) orders = orders.filter(order => order.id === eq('id'))
        if (eq('status')) orders = orders.filter(order => order.status === eq('status'))
        const count = orders.length
        const offset = Number(url.searchParams.get('offset') || 0)
        const limit = Number(url.searchParams.get('limit') || 100)
        orders = orders.slice(offset, offset + limit)
        for (const order of orders) order.items = (await db.query('select * from order_items where order_id=$1', [order.id])).rows
        res.setHeader('Content-Range', `${offset}-${Math.max(offset, offset + orders.length - 1)}/${count}`)
        return send(req.headers.accept?.includes('vnd.pgrst.object') ? orders[0] : orders)
      }
      if (url.pathname === '/rest/v1/order_email_jobs' && req.method === 'GET') {
        if (!admin) return send({ message: 'Forbidden' }, 403)
        return send((await db.query('select * from order_email_jobs where order_id=$1', [eq('order_id')])).rows)
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
  const app = spawn(process.execPath, ['--require', path.join(__dirname, 'browser-email-transport.cjs'), 'node_modules/next/dist/bin/next', 'start', '-p', '3110'], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3111', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-test-anon',
      SUPABASE_SERVICE_ROLE_KEY: 'local-test-service', EMAIL_USER: 'fixture@example.com', EMAIL_PASS: 'fixture-only',
      EMAIL_HOST: '127.0.0.1', EMAIL_PORT: '3112', EMAIL_FROM: 'AABROZE <fixture@example.com>',
      ORDER_NOTIFICATION_EMAIL: 'aabroze.pk@gmail.com', WHATSAPP_TOKEN: '', ORDER_EMAIL_RETRY_SECRET: 'local-test-retry' },
  })
  const stop = () => { app.kill(); server.close(); db.close().finally(() => process.exit()) }
  process.on('SIGTERM', stop); process.on('SIGINT', stop)
  app.on('exit', () => { server.close(); db.close().finally(() => process.exit()) })
}
main().catch((error) => { console.error(error); process.exit(1) })
