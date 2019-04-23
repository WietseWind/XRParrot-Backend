const express = require('express')
const bodyParser = require('body-parser')

module.exports = async function (expressApp) {
  expressApp.use(bodyParser.json())
  
  /**
   * API Router
   */
  const router = express.Router()

  router.get('/', function(req, res) {
    // throw new Error("BROKEN")
    res.json({ message: 'Welcome @ XRParrot' })
  })

  router.post('/hook', require('./api/hook'))  
  router.post('/beta', require('./api/beta'))
  router.post('/captcha', require('./api/captcha'))
  router.post('/xrpl-destination', require('./api/xrpl-destination'))
  router.post('/iban', require('./api/iban-check'))
  router.post('/phone', require('./api/phone'))
  router.post('/finish', require('./api/finish'))
  router.post('/mail', require('./api/mail'))
  router.post('/support', require('./api/support'))
  router.post('/token', require('./api/token'))

  router.get('/orders', require('./api/orders').get)
  router.get('/order/:order', require('./api/orders').get)
  router.get('/orders/beta-codes', require('./api/orders').getBetaCodes)
  // router.post('/orders', require('./api/orders').set)

  router.get('/payment-cursor', require('./api/payments').cursor)
  router.get('/payments', require('./api/payments').get)
  router.get('/payment/:payment', require('./api/payments').get)
  router.post('/payments', require('./api/payments').set)
  router.post('/payments/approve', require('./api/payments').approve)
  router.post('/payments/refund', require('./api/payments').refund)
  router.post('/payments/process-payout', require('./api/payments').process)
  router.post('/payments/process-refund', require('./api/payments').processRefund)
  router.post('/payment/:payment', require('./api/payments').callback)

  router.post('/', function(req, res, next) {
    if (typeof req.body === 'object' && typeof req.body.name !== 'undefined') {
      res.json({ message: 'Pong!', mode: req.config.mode, data: req.body })
    } else {
      next()
    }
  })

  // APIROUTER WILDCARD - FALLBACK
  router.all('*', function(req, res){
    if ('OPTIONS' === req.method) {
      req.session.destroy()
      res.sendStatus(200)
    } else {
      res.status(404).json({ error: true, req: req.url })
    }
  })

  // Use
  expressApp.use('/api', router)
}
