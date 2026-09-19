require('./load-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createDatabase, seed, place } = require('./database.cjs')
const nodemailer = require('nodemailer')
const adminModule = require('../lib/supabase/admin.ts')
const { deliverOrderEmails } = require('../lib/order-emails.ts')

test('email worker retries only the failed recipient and never creates another order', async (t) => {
  const db = await createDatabase()
  t.after(() => db.close())
  await seed(db)
  const { order } = await place(db)
  // Supabase adapter exercises actual claim/update SQL; SMTP acceptance is simulated.
  const originalAdmin = adminModule.createSupabaseAdminClient
  const originalTransport = nodemailer.createTransport
  const env = { EMAIL_USER: process.env.EMAIL_USER, EMAIL_PASS: process.env.EMAIL_PASS }
  t.after(() => {
    adminModule.createSupabaseAdminClient = originalAdmin
    nodemailer.createTransport = originalTransport
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
  process.env.EMAIL_USER = 'local-smtp-test@example.com'
  process.env.EMAIL_PASS = 'local-test-placeholder'
  const sent = []
  let customerFails = true
  nodemailer.createTransport = () => ({
    sendMail: async (mail) => {
      sent.push(mail)
      if (customerFails && mail.subject.startsWith('Your ')) throw new Error('Simulated SMTP failure')
      return { accepted: [mail.to] }
    }, close() {},
  })
  adminModule.createSupabaseAdminClient = () => ({
    rpc: async (_name, args) => ({ data: (await db.query('select * from claim_order_emails($1)', [args.p_order_id])).rows }),
    from: (table) => {
      const filters = {}
      let values
      const builder = {
        select() { return builder },
        eq(key, value) { filters[key] = value; return builder },
        update(value) { values = value; return builder },
        async single() {
          const order = (await db.query('select * from orders where id=$1', [filters.id])).rows[0]
          order.items = (await db.query('select * from order_items where order_id=$1', [filters.id])).rows
          return { data: order }
        },
        then(resolve, reject) {
          assert.equal(table, 'order_email_jobs')
          return db.query('update order_email_jobs set sent_at=$1,last_error=$2,locked_until=$3,lease_token=$4,next_attempt_at=$5 where id=$6 and lease_token=$7',
            [values.sent_at,values.last_error,values.locked_until,values.lease_token,values.next_attempt_at,filters.id,filters.lease_token])
            .then(() => resolve({ error: null }), reject)
        },
      }
      return builder
    },
  })
  await deliverOrderEmails(order.id)
  assert.equal(sent.length, 2)
  let jobs = (await db.query('select * from order_email_jobs order by recipient')).rows
  assert.ok(jobs.find((job) => job.recipient === 'owner').sent_at)
  assert.equal(jobs.find((job) => job.recipient === 'customer').sent_at, null)
  assert.ok(jobs.find((job) => job.recipient === 'customer').last_error)
  // No early or duplicate resend while the failed job is in backoff.
  await deliverOrderEmails(order.id)
  assert.equal(sent.length, 2)
  customerFails = false
  await db.exec("update order_email_jobs set next_attempt_at=now() where sent_at is null")
  await deliverOrderEmails(order.id)
  assert.equal(sent.length, 3)
  assert.match(sent[2].subject, /^Your AABROZE Order Confirmation/)
  jobs = (await db.query('select * from order_email_jobs')).rows
  assert.ok(jobs.every((job) => job.sent_at))
  assert.equal((await db.query('select count(*)::int as n from orders')).rows[0].n, 1)
})
