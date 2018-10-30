const ipRange = require("ip-range-check")

const get = async (req, res) => {
  const trusted = ipRange(req.remoteAddress, req.config.platformIps || "127.0.0.1")
  if (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || '')) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  await new Promise((resolve, reject) => {
    if (trusted) {
      req.mongo.collection('orders')
        .find({
        }, { 
          projection: {
            _id: false,
            orderIds: true,
            details: true,
            moment: true,
            'session.betaInvitationCode': true
          }
        })
        .sort({ 
          _id: parseInt(req.query.skip) || -1
        })
        .skip(parseInt(req.query.skip) || 0)
        .limit(parseInt(req.query.limit) || 10)
        .toArray(function(err, r) {
          if (err) return reject(err)
          resolve(r)
        })
    } else {
      reject(new Error('Nope.'))
    }
  }).then(orders => {
    res.json({ error: false, data: orders })
  }).catch(e => {
    res.json({ error: true, message: e.toString() })
  })
}

const set = async (req, res) => {
  const trusted = ipRange(req.remoteAddress, req.config.platformIps || "127.0.0.1")
  if (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || '')) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  await new Promise((resolve, reject) => {
    return reject(new Error('Nada.'))
  }).then(orders => {
    res.json({ error: false, data: orders })
  }).catch(e => {
    res.json({ error: true, message: e.toString() })
  })
}

module.exports = { get, set }