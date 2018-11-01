const ipRange = require("ip-range-check")
const { to, from } = require('../../helpers/orderDescriptionEncoder')

const cursor = async (req, res) => {
  const trusted = ipRange(req.remoteAddress, req.config.platformIps || "127.0.0.1")
  if (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || '')) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  let query = {
    '_seen.pull': { '$exists': true }
  }
  const paymentId = req.params.payment || null
  if (paymentId !== null) {
    query = {
      '$or': [
        { 'counterparty_alias.iban': paymentId },
        { 'description': (orderId + '') },
        { 'description': { '$regex': (orderId + '') } },
      ]
    }
  }
  await new Promise((resolve, reject) => {
    if (trusted) {
      req.mongo.collection('payments')
        .find(query, { 
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
  if (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || '')) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  await new Promise((resolve, reject) => {
    if (trusted) {
      req.mongo.collection('payments')
        .find({
        }, { 
          projection: {
            _id: false
          }
        })
        .sort({ 
          id: parseInt(req.query.skip) || -1
        })
        .skip(parseInt(req.query.skip) || 0)
        .limit(parseInt(req.query.limit) || 10)
        .toArray(function(err, r) {
          if (err) return reject(err)
          resolve(r.map(payment => {
            let _validation = {}
            let _paymentIdentification

            try {
              if (parseFloat(payment.amount.value) < 1) {
                _validation.amount = 'Payment amount below 1 EUR'
              }
              if (payment.amount.currency !== 'EUR') {
                _validation.currency = 'Payment currency not EUR'
              }
              if (typeof payment._seen.push === 'undefined') {
                _validation.push = 'Payment not PUSH-verified (by bank)'
              }
              if (typeof payment._seen.pull === 'undefined') {
                _validation.pull = 'Payment not PULL-verified (backend, from bank)'
              }
              
              _paymentIdentification = payment.description.match(/([0-9]{4,})[ \.\/\-]*([a-zA-Z]{3,})/)
              if (!_paymentIdentification) {
                _validation.identificationMissing = 'No payment identifier (description) found'
              } else {
                let textId = to(_paymentIdentification[1])
                let textChecksum = to(_paymentIdentification[1] % 13)
                let userTextId = _paymentIdentification[2].toUpperCase().slice(0, -1)
                let userTextChecksum = _paymentIdentification[2].toUpperCase().slice(-1)
                if (_paymentIdentification[2].toUpperCase() !== textId + textChecksum) {
                  _validation.identificationMismatch = `Payment ID Text [${textId}${textChecksum}] doesn't match Payment ID Int [${_paymentIdentification[1]}]`
                }
                if (userTextChecksum !== to(from(userTextId) % 13)) {
                  _validation.identificationChecksum = 'Invalid Payment ID Checksum'
                }
                if (from(userTextId) !== parseInt(_paymentIdentification[1])) {
                  _validation.identificationRedundancyMismatch = `Payment ID is [${_paymentIdentification[1]}], but Redundancy Text results in [${from(userTextId)}]`
                }
              }
            } catch (e) {
              _validation.internalError = e.message
            }
            return Object.assign(payment, {
              _validation: _validation,
              _paymentIdentification: _paymentIdentification
            })
          }))
        })
    } else {
      reject(new Error('Nope.'))
    }
  }).then(payments => {
    res.json({ error: false, data: payments })
  }).catch(e => {
    res.json({ error: true, message: e.toString() })
  })
}

const set = async (req, res) => {
  const orderMethod = typeof req.orderMethod === 'string' ? req.orderMethod : 'pull'
  if (orderMethod !== 'push' && (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || ''))) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
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