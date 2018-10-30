const ipRange = require("ip-range-check")

const cursor = async (req, res) => {
  const trusted = ipRange(req.remoteAddress, req.config.platformIps || "127.0.0.1")
  await new Promise((resolve, reject) => {
    if (trusted) {
      req.mongo.collection('payments')
        .find({
          '_seen.pull': { '$exists': true }
        }, { 
          projection: {
            _id: false,
            id: true
          }
        })
        .sort({ id: -1 })
        .limit(1)
        .toArray(function(err, r) {
          if (err) return reject(err)
          console.log('# Got hightest [pull] payment id:', r)
          resolve(r.length > 0 ? r[0].id : 0)
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

const get = async (req, res) => {
  const trusted = ipRange(req.remoteAddress, req.config.platformIps || "127.0.0.1")
  await new Promise((resolve, reject) => {
    if (trusted) {
      req.mongo.collection('payments')
        .find({
          '_seen.pull': { '$exists': true }
        }, { 
          projection: {
            _id: false,
            id: true
          }
        })
        .sort({ id: -1 })
        .limit(1)
        .toArray(function(err, r) {
          if (err) return reject(err)
          console.log('# Got hightest [pull] payment id:', r)
          resolve(r.length > 0 ? r[0].id : 0)
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
  const orderMethod = typeof req.orderMethod === 'string' ? req.orderMethod : 'pull'
  const trusted = ipRange(req.remoteAddress || '127.0.0.1', req.config.platformIps || '127.0.0.1')
  await new Promise((resolve, reject) => {
    if (trusted || orderMethod === 'push') {
      if (Array.isArray(req.body) && req.body.length > 0) {
        req.body.filter(p => {
          return typeof p === 'object' && p instanceof Object && typeof p.id !== 'undefined'
        }).forEach(p => {
          return req.mongo.collection('payments').updateOne({ 
            id: p.id
          }, { 
            '$set': { 
              ...p,
              ['_seen.' + orderMethod]: new Date()
            }
          }, { 
            upsert: true,
            writeConcern: {
              w: 'majority',
              j: true
            }
          }, function(err, r) {
            if (err) {
              console.log('DB[PAYMENT] >> ERROR', err.toString())
              reject(err)
            } else {
              console.log(':: PAYMENT REGISTERED ', p.id, { upsertedCount: r.upsertedCount, matchedCount: r.matchedCount, modifiedCount: r.modifiedCount, upsertedId: r.upsertedId })
            }
          })
        })
      }
      resolve(true)
    } else {
      reject(new Error('Nah.'))
    }
  }).then(orders => {
    if (res instanceof Object) {
      res.json({ error: false, data: orders })
    }
    return true
  }).catch(e => {
    if (res instanceof Object) {
      res.json({ error: true, message: e.toString() })
    } else {
      console.log('! Insert hook-payment error:', e.toString())
    }
    return false
  })
}


module.exports = { get, cursor, set }