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
      ip: req.remoteAddress,
      route: req.route,
      url: req.url,
      moment: new Date(),
      headers: req.headers,
      data: req.body
    }, function(err, r) {
      if (err) {
        console.log('DB[HOOK]', err.toString())
      } else {
        console.log('DB[HOOK]', r.insertedCount, r.insertedId)
      }
    })
    res.json({ message: 'HOOK' })
  })

  router.post('/', function(req, res, next) {
    if (typeof req.body === 'object' && typeof req.body.name !== 'undefined') {
      res.json({ 
        message: 'posted!', 
        data: req.body,
        config: req.config
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
