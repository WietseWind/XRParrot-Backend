
module.exports = async function (expressApp) {
  expressApp.use((req, res, next) => {
    if (req.routeType === 'api') {
      // TODO
      // console.log('<< API RATE LIMIT FOR SESSION >>', req.session.id, req.remoteAddress, req.session.reqCount)
      // res.status(429).json({
      //   error: 429,
      //   message: 'Too Many Requests'
      // })
    }
    if (res.statusCode !== 429) {
      next()
    }
  })
}
