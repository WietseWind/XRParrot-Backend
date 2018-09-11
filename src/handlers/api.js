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
