const express = require('express')
const nunjucks = require('nunjucks')
const ipRange = require("ip-range-check")
const fs = require("fs")
const path = require('path')
const app = express()
const bodyParser = require('body-parser')

const config = {
  port: process.env.PORT || 3001,
  mode: process.env.NODE_ENV || 'development',
  mongo: process.env.MONGO || '127.0.0.1:20000/xrparrot'
}

app.set('view engine', 'html')

nunjucks.configure('public_html', {
  noCache:  config.mode === 'development',
  watch: config.mode === 'development',
  autoescape: true,
  express: app
})

fs.readFile(path.resolve(__dirname, `${config.mode}.json`), (err, data) => {
  if (err) {
    console.log('CONFIG FILE ERROR:', err.toString())
  } else {
    console.log('GOT CONFIG FILE CONTENTS:')
    try {
      const envConfig = JSON.parse(data.toString('utf8'))
      Object.assign(config, envConfig)
      console.log('RUNNING CONFIG IS NOW', config)
    } catch (e) {
      console.log('CONFIG FILE PARSE ERROR', e.toString())
    }
  }
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

/**
 * API Router
 */
const apiRouter = express.Router()

app.use((req, res, next) => {
  req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  req.ipSafe = ipRange(req.ip, [ '185.40.108.0/22', '127.0.0.1' ])
  console.log('LOGGED', req.url, ' from ', req.ip, ' -- safe ip? ', req.ipSafe ? 1 : 0)
  next()
})

apiRouter.get('/', function(req, res) {
  res.json({ message: 'Welcome @ XRParrot' })
})

apiRouter.post('/', function(req, res, next) {
  if (typeof req.body === 'object' && typeof req.body.name !== 'undefined') {
    console.log('  >> Got API call from ', req.ip)
    // console.dir(process.env.MODE, { depth: null }) // From Docker
    // console.dir(process.env.PORT, { depth: null }) // From PM2
    // console.dir(process.env.NODE_ENV, { depth: null }) // From PM2
    // console.dir(process.env.MONGO, { depth: null }) // From PM2

    res.json({ 
      message: 'posted!', 
      data: req.body,
      config: config
    })
  } else {
    next()
  }
})

apiRouter.post('*', function(req, res) {
  res.json({ error: true })
})

app.use('/', express.static('public_html'))
app.use('/api', apiRouter)

app.get('/about', function(req, res){
  return res.render('about.html')
})

app.get('*', function(req, res){
  res.status(404).render('404', { error: 'file not found' })
})

app.listen(config.port)
console.log(`XRParrot ${config.mode} - Server running at port ${config.port}`)

/**
 * Stopping the process, got signal from PM2 (?)
 */
process.on('SIGINT', function() {
  // db.stop(function(err) {
  console.log('--- STOPPING ---')
  process.exit() //err ? 1 : 0
  // });
});