const ipRange = require("ip-range-check")

module.exports = async function (expressApp) {
  expressApp.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    req.remoteAddress = ip
    req.ipTrusted = ipRange(ip, [ "", "185.40.108.0/22" ])

    if (typeof req.config.logRequestsToConsole !== 'undefined' && req.config.logRequestsToConsole) {
      console.log(`>> [${req.config.mode}, trusted: ${req.ipTrusted ? 1 : 0}] Got [${req.route}] call [${req.headers['content-type']}] to [${req.url}] from ${req.remoteAddress}`)
    }

    next()
  })
}
