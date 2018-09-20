const ipRange = require("ip-range-check")

module.exports = async function (expressApp) {
  expressApp.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    req.remoteAddress = ip
    req.ipTrusted = ipRange(ip, req.config.ips || "127.0.0.1")

    if (typeof req.config.logRequestsToConsole !== 'undefined' && req.config.logRequestsToConsole) {
      if (typeof req.session.reqCount === 'undefined') req.session.reqCount = 0
      req.session.reqCount++
      console.log(`>> [${req.config.mode}, trusted: ${req.ipTrusted ? 1 : 0}] Got [${req.route}] call [${req.headers['content-type']||'NO CONTENT-TYPE'}] to [${req.url}] from ${req.remoteAddress} SSID: ${req.session.id} . ${req.session.reqCount}`)
    }

    next()
  })
}
