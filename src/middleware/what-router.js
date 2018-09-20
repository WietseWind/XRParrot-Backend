module.exports = async function (expressApp) {
  expressApp.use((req, res, next) => {
    if (typeof req.headers['content-type'] !== 'undefined' && req.headers['content-type'].match(/application\/json/i)) {
      req.route = 'api'
    } else {
      req.route = 'web'
    }
    req.url = '/' + req.route + req.url

    if (req.url.match(/^\/(web|api)\/(web|api)/)) {
      req.url = req.url.slice(4)
      req.route = req.url.slice(1, 4)
    }

    next('route')
  })
}
