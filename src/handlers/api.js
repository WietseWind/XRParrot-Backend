const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const FormData = require('form-data')

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

  router.post('/captcha', function(req, res) {
    // throw new Error("BROKEN")
    console.log('CAPTCHA', req.body.token)
    const form = new FormData();
    form.append('secret', req.config.captchaToken || '')
    form.append('response', req.body instanceof Object && typeof req.body.token !== 'undefined' ? req.body.token : '')
    form.append('remoteip', req.remoteAddress)

    fetch('https://www.google.com/recaptcha/api/siteverify', { 
      method: 'POST', 
      body: form
    })
    .then(res => res.json())
    .then(json => {
      console.log('Captcha Response', json)
      res.json({ message: 'Captcha received', trusted: req.ipTrusted, response: json })
    })
  })

  router.post('/hook', function(req, res) {
    req.mongo.collection('hook').insertOne({
      mode: req.config.mode,
      trusted: req.ipTrusted,
      req: {
        ip: req.remoteAddress,
        route: req.routeType,
        url: req.url,
        headers: req.headers
      },
      moment: new Date(),
      data: req.body,
      flow: {
        reversal: null,
        payout: null,
        processed: null
      }
    }, function(err, r) {
      if (err) {
        console.log('DB[HOOK]', err.toString())
      } else {
        console.log('DB[HOOK]', r.insertedCount, r.insertedId)
      }
    })
    res.json({ message: 'Hook received', trusted: req.ipTrusted })
  })

  router.post('/', function(req, res, next) {
    if (typeof req.body === 'object' && typeof req.body.name !== 'undefined') {
      res.json({ 
        message: 'Pong!', 
        mode: req.config.mode,
        data: req.body
      })
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
