const express = require('express')
const bodyParser = require('body-parser')

module.exports = async function (expressApp) {
  expressApp.use(bodyParser.json())
  
  /**
   * API Router
   */
  const router = express.Router()

  router.get('/', function(req, res) {
    res.json({ message: 'Welcome @ XRParrot' })
  })

  router.post('/api/hook', function(req, res) {
    req.mongo.collection('hook').insertOne({
      mode: req.config.mode,
      trusted: req.ipTrusted,
      req: {
        ip: req.remoteAddress,
        route: req.route,
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
    res.status(404).json({ error: true, req: req.url })
  })

  // Use
  expressApp.use('/api', router)
}
