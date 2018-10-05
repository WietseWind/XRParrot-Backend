const express = require('express')
const nunjucks = require('nunjucks')
const bodyParser = require('body-parser')

module.exports = async function (expressApp) {
  expressApp.use(bodyParser.urlencoded({ extended: true }))
  
  /**
   * WEB Router
   */
  const router = express.Router()

  router.get(['/', '/index.html'], (req, res, next) => {
    return res.render('index.html')
  })

  router.get('/*', express.static('public_html'))

  router.get('/about', (req, res, next) => {
    // throw new Error("BROKEN")
    return res.render('about.html')
  })

  // WEBROUTER WILDCARD - FALLBACK
  router.all('*', function(req, res){
    if ('OPTIONS' === req.method) {
      req.session.destroy()
      res.sendStatus(200)
    } else {
      res.status(404).render('404', { error: 'file not found' })
    }
  })

  // Use
  expressApp.use('/web', router)

  /**
   * Template engine
   */
  expressApp.set('view engine', 'html')

  const env = nunjucks.configure('public_html', {
    noCache:  expressApp.config.mode === 'development',
    watch: expressApp.config.mode === 'development',
    autoescape: true,
    express: expressApp
  })

  /**
   * Testing.
   */
  env.addFilter('sleep', function sleep (input, callback) {
    const args = Object.values(arguments).slice(1, -1)
    setTimeout(() => {
      arguments[arguments.length - 1](false, arguments[0])
    }, (args[0] || 1) * 1000)
  }, true)

  env.addFilter('test', function sleep (input, callback) {
    const args = Object.values(arguments).slice(1, -1)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([ 'a', 'b', 'c', 'd' ])
      }, (args[0] || 1) * 1000)
    }).then(results => {
      arguments[arguments.length - 1](false, results)
    })
  }, true)
}