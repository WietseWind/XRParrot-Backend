module.exports = async function (expressApp) {
  expressApp.use((req, res, next) => {
    if (typeof req.headers['content-type'] !== 'undefined' && req.headers['content-type'].match(/application\/json/i)) {
      req.route = 'api'
    } else {
      req.route = 'web'
    }
    req.url = '/' + req.route + req.url
    next('route')
  })
}
