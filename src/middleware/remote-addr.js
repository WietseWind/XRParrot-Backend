const ipRange = require("ip-range-check")

module.exports = async function (expressApp) {
  expressApp.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    req.remoteAddress = ip
    req.remoteAddressInternal = req.remoteAddress.match(/^::ffff:172\./)
    if (!req.remoteAddressInternal) {
      req.session.lastIp = req.remoteAddress
    }
    req.ipTrusted = ipRange(ip, req.config.ips || "127.0.0.1")
    next()
  })
}
