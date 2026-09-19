// Loaded only by the isolated browser-test process. Never opens an SMTP connection.
const nodemailer = require('nodemailer')
const originalFetch = globalThis.fetch
globalThis.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('Browser tests may contact only local fixture services')
  }
  return originalFetch(input, options)
}
nodemailer.createTransport = () => ({
  async sendMail(mail) {
    const response = await fetch('http://127.0.0.1:3111/__mail', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mail),
    })
    if (!response.ok) throw new Error('Simulated SMTP failure')
    return { accepted: [mail.to] }
  },
  close() {},
})
