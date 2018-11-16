const ipRange = require("ip-range-check")
const { to, from } = require('../../helpers/orderDescriptionEncoder')
const messagebirdApi = require('messagebird')

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
      let query = {}
      if (typeof req._processorderId !== 'undefined') {
        query = { id: req._processorderId }
      }
      req.mongo.collection('payments')
        .find(query, { 
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
          resolve(Promise.all(r.map(async payment => {
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
                let _textChecksum = _paymentIdentification[1] % 13
                if (_textChecksum % 13 === 0) {
                  // Fix 0 endless loop bug, can't change module because of existing ids
                  _textChecksum++
                }
                let textChecksum = to(_textChecksum)
                let userTextId = _paymentIdentification[2].toUpperCase().slice(0, -1)
                let userTextChecksum = _paymentIdentification[2].toUpperCase().slice(-1)
                if (_paymentIdentification[2].toUpperCase() !== textId + textChecksum) {
                  _validation.identificationMismatch = `Payment ID Text [${textId}${textChecksum}] doesn't match Payment ID Int [${_paymentIdentification[1]}]`
                }
                let _userTextId = from(userTextId)
                if (_userTextId % 13 === 0) {
                  // Fix 0 endless loop bug, can't change module because of existing ids
                  _userTextId++
                }
                if (userTextChecksum !== to(_userTextId % 13)) {
                  _validation.identificationChecksum = 'Invalid Payment ID Checksum'
                }
                if (from(userTextId) !== parseInt(_paymentIdentification[1])) {
                  _validation.identificationRedundancyMismatch = `Payment ID is [${_paymentIdentification[1]}], but Redundancy Text results in [${from(userTextId)}]`
                }
              }
            } catch (e) {
              _validation.internalError = e.message
            }
            
            let _order
            if (typeof payment._approved === 'undefined' || typeof req._processorderId !== 'undefined') {
              // Only do a hard-lookup for not yet approved orders
              if (Object.keys(_validation).length === 0 || (Object.keys(_validation).length === 1 && [ 'push', 'pull' ].indexOf(Object.keys(_validation)[0]) > -1)) {
                // NO errors or just a SOFT error (push / pull), so a order lookup is required
                let orderId = _paymentIdentification[1] + '.' + _paymentIdentification[2].toUpperCase()
                // orderId = '1408.HCXD'
                await require('./orders').get(Object.assign(req, { params: { order: orderId } }), { json: r => {
                  // console.log('FetchOrder>Payment', r)
                  if (r.data instanceof Object && Object.values(r.data).length > 0) {
                    _order = Object.values(r.data)[0]
                    if (typeof _order.moment === 'undefined') {
                      _order = null
                      _validation.orderInvalid = `Order [${orderId}] invalid`
                    } else {
                      if (_order.details.bank.toUpperCase() !== payment.counterparty_alias.iban.toUpperCase()) {
                        _validation.bankAccountMismatch = `Order for IBAN ${_order.details.bank}, payment received from ${payment.counterparty_alias.iban}`
                        _order = null
                      }
                    }
                  } else {
                    _validation.orderNotFound = 'Order not found.'
                  }
                }})
              }
            }

            return Object.assign(payment, {
              _validation: _validation,
              _paymentIdentification: _paymentIdentification,
              _order: _order
            })
          })))
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
  let orderMethod = typeof req.orderMethod === 'string' ? req.orderMethod : 'pull'
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
          if (typeof p.amount !== 'undefined' && p.amount instanceof Object && typeof p.amount.value !== 'undefined') {
            if (parseFloat(p.amount.value) < 0) {
              console.log('------ Hook for payment < 0 (outgoing), skip')
              return false
            }
          }
          if (typeof p._original_description !== 'undefined' && typeof p.description !== 'undefined' && Object.keys(p).length === 3) {
            orderMethod = 'manuallyUpdated'
          }
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
              console.log(':: PAYMENT [' + orderMethod + '] REGISTERED ', p.id, { upsertedCount: r.upsertedCount, matchedCount: r.matchedCount, modifiedCount: r.modifiedCount, upsertedId: r.upsertedId })
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

const approve = async (req, res) => {
  const orderMethod = typeof req.orderMethod === 'string' ? req.orderMethod : 'approve'
  if (orderMethod !== 'internal' && (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || ''))) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  const trusted = ipRange(req.remoteAddress || '127.0.0.1', req.config.platformIps || '127.0.0.1')
  await new Promise((resolve, reject) => {
    if (trusted || orderMethod === 'internal') {
      if (Array.isArray(req.body) && req.body.length > 0) {
        req.body.filter(p => {
          return typeof p === 'object' && p instanceof Object && typeof p.id !== 'undefined'
        }).forEach(p => {
          return req.mongo.collection('payments').updateOne({ 
            id: p.id,
            _approved: { '$exists': false },
            _refunded: { '$exists': false }
          }, { 
            '$set': { 
              _approved: {
                ip: req.remoteAddress
              },
              [ '_seen.' + orderMethod ]: new Date()
            }
          }, { 
            upsert: false,
            writeConcern: {
              w: 'majority',
              j: true
            }
          }, function(err, r) {
            if (err) {
              console.log('DB[PAYMENT APPROVAL] >> ERROR', err.toString())
              reject(err)
            } else {
              console.log(':: PAYMENT APPROVED ', p.id, { upsertedCount: r.upsertedCount, matchedCount: r.matchedCount, modifiedCount: r.modifiedCount, upsertedId: r.upsertedId })
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
      console.log('! Insert hook-payment-approval error:', e.toString())
    }
    return false
  })
}

const refund = async (req, res) => {
  const orderMethod = typeof req.orderMethod === 'string' ? req.orderMethod : 'refund'
  if (orderMethod !== 'internal' && (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || ''))) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  const trusted = ipRange(req.remoteAddress || '127.0.0.1', req.config.platformIps || '127.0.0.1')
  await new Promise((resolve, reject) => {
    if (trusted || orderMethod === 'internal') {
      if (Array.isArray(req.body) && req.body.length > 0) {
        req.body.filter(p => {
          return typeof p === 'object' && p instanceof Object && typeof p.id !== 'undefined'
        }).forEach(p => {
          return req.mongo.collection('payments').updateOne({ 
            id: p.id,
            _refunded: { '$exists': false },
            _approved: { '$exists': false }
          }, { 
            '$set': { 
              _refunded: {
                ip: req.remoteAddress
              },
              [ '_seen.' + orderMethod ]: new Date()
            }
          }, { 
            upsert: false,
            writeConcern: {
              w: 'majority',
              j: true
            }
          }, function(err, r) {
            if (err) {
              console.log('DB[PAYMENT REFUND] >> ERROR', err.toString())
              reject(err)
            } else {
              console.log(':: PAYMENT REFUNDED ', p.id, { upsertedCount: r.upsertedCount, matchedCount: r.matchedCount, modifiedCount: r.modifiedCount, upsertedId: r.upsertedId })
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
      console.log('! Insert hook-payment-approval error:', e.toString())
    }
    return false
  })
}

const process = async (req, res) => {
  let reRoutedToOrder = false
  const orderMethod = typeof req.orderMethod === 'string' ? req.orderMethod : 'process'
  if (orderMethod !== 'internal' && (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || ''))) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  const trusted = ipRange(req.remoteAddress || '127.0.0.1', req.config.platformIps || '127.0.0.1')
  await new Promise((resolve, reject) => {
    if (trusted || orderMethod === 'internal') {
      req.mongo.collection('payments')
        .find({
          _approved: { '$exists': true },
          _refunded: { '$exists': false },
          _processed: { '$exists': false }
        }, { 
          projection: { _id: false, id: true }
        })
        .sort({ 
          id: 1
        })
        .skip(0)
        .limit(1)
        .toArray(function(err, r) {
          if (err) return reject(err)
          try {
            if (r && r.length > 0) {
              // Do update
              req.mongo.collection('payments').updateOne({ id: r[0].id }, {
                '$set': { _processed: new Date(), [ '_seen.' + 'processed' ]: new Date() }
              }, { upsert: false, writeConcern: { w: 'majority', j: true } }, function(err, u) {
                if (err) {
                  console.log('DB[PAYMENT PRE-SENDING] >> ERROR', err.toString())
                  reject(err)
                } else {
                  console.log(':: PAYMENT PRE-SENDING UPDATE ', r[0].id, { upsertedCount: u.upsertedCount, matchedCount: u.matchedCount, modifiedCount: u.modifiedCount, upsertedId: u.upsertedId })
                  reRoutedToOrder = true
                  req._processorderId = r[0].id
                  get(req, res).then(() => {
                    resolve()
                  })
                }
              })              
            } else{
              reject(new Error('No data'))
            }
          } catch (e) {
            reject(e)
          }
        })
    } else {
      reject(new Error('Nah.'))
    }
  }).then(payment => {
    if (res instanceof Object && !reRoutedToOrder) {
      res.json({ error: false, data: payment })
    }
    return true
  }).catch(e => {
    if (res instanceof Object && !reRoutedToOrder) {
      res.json({ error: true, message: e.toString() })
    } else {
      console.log('! Insert hook-payment-approval error:', e.toString())
    }
    return false
  })
}

const processRefund = async (req, res) => {
  let reRoutedToOrder = false
  const orderMethod = typeof req.orderMethod === 'string' ? req.orderMethod : 'process'
  if (orderMethod !== 'internal' && (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || ''))) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  const trusted = ipRange(req.remoteAddress || '127.0.0.1', req.config.platformIps || '127.0.0.1')
  await new Promise((resolve, reject) => {
    if (trusted || orderMethod === 'internal') {
      req.mongo.collection('payments')
        .find({
          _refunded: { '$exists': true },
          _approved: { '$exists': false },
          _processed: { '$exists': false }
        }, { 
          projection: { _id: false, id: true }
        })
        .sort({ 
          id: 1
        })
        .skip(0)
        .limit(1)
        .toArray(function(err, r) {
          if (err) return reject(err)
          try {
            if (r && r.length > 0) {
              // Do update
              req.mongo.collection('payments').updateOne({ id: r[0].id }, {
                '$set': { _processed: new Date(), [ '_seen.' + 'processed' ]: new Date() }
              }, { upsert: false, writeConcern: { w: 'majority', j: true } }, function(err, u) {
                if (err) {
                  console.log('DB[REFUND PRE-SENDING] >> ERROR', err.toString())
                  reject(err)
                } else {
                  console.log(':: REFUND PRE-SENDING UPDATE ', r[0].id, { upsertedCount: u.upsertedCount, matchedCount: u.matchedCount, modifiedCount: u.modifiedCount, upsertedId: u.upsertedId })
                  reRoutedToOrder = true
                  req._processorderId = r[0].id
                  get(req, res).then(() => {
                    resolve()
                  })
                }
              })              
            } else{
              reject(new Error('No data'))
            }
          } catch (e) {
            reject(e)
          }
        })
    } else {
      reject(new Error('Nah.'))
    }
  }).then(payment => {
    if (res instanceof Object && !reRoutedToOrder) {
      res.json({ error: false, data: payment })
    }
    return true
  }).catch(e => {
    if (res instanceof Object && !reRoutedToOrder) {
      res.json({ error: true, message: e.toString() })
    } else {
      console.log('! Insert hook-payment-approval error:', e.toString())
    }
    return false
  })
}

const callback = async (req, res) => {
  const paymentId = req.params.payment || null
  const orderMethod = typeof req.orderMethod === 'string' ? req.orderMethod : 'process'
  if (orderMethod !== 'internal' && (typeof req.config.apiAuthorization === 'undefined' || (req.headers['authorization'] || '') !== (req.config.apiAuthorization || ''))) {
    return res.status(403).json({ error: true, message: '403. Nope.' })
  }
  const trusted = ipRange(req.remoteAddress || '127.0.0.1', req.config.platformIps || '127.0.0.1')
  await new Promise((resolve, reject) => {
    if ((trusted || orderMethod === 'internal') && parseInt(paymentId) === req.body.paymentId && !isNaN(parseInt(req.body.paymentId))) {
      req.mongo.collection('payments').updateOne({ id: req.body.paymentId }, {
        '$set': { _sent: req.body, [ '_seen.' + 'sent' ]: new Date() }
      }, { upsert: false, writeConcern: { w: 'majority', j: true } }, function(err, u) {
        if (err) {
          console.log('DB[PAYMENT CALLBACK] >> ERROR', err.toString())
          reject(err)
        } else {
          const storageResults = { upsertedCount: u.upsertedCount, matchedCount: u.matchedCount, modifiedCount: u.modifiedCount, upsertedId: u.upsertedId }
          console.log(':: PAYMENT CALLBACK UPDATE ', paymentId, storageResults)
          const paymentSentOK = (storageResults.matchedCount === 1 && storageResults.modifiedCount === 1) && typeof req.body.error !== 'undefined' && !req.body.error && typeof req.body.xrplTxPayout !== 'undefined' && req.body.xrplTxPayout.hash.match(/^[A-F0-9]+$/)
          const refundSentOK = (storageResults.matchedCount === 1 && storageResults.modifiedCount === 1) && typeof req.body.error !== 'undefined' && !req.body.error && typeof req.body.xrplTxPayout === 'undefined' && typeof req.body.paymentId !== 'undefined' && (req.body.paymentId + '').match(/^[0-9]+$/)
          resolve({
            payment: paymentId,
            result: paymentSentOK || refundSentOK
          })
          if (paymentSentOK || refundSentOK) {
            const messagebird = messagebirdApi(req.config.messagebirdKey)
            let numberFormatted = ''
            let msgBody = ''
            let originator = '+447427513374'
            try {
              if (paymentSentOK) {
                numberFormatted = req.body.order.details.phone
                let amount = (parseInt(req.body.xrplTxPayout.Amount) / 1000000).toFixed(6).replace(/0+$/g, '')
                msgBody = `Your payment (${req.body.amounts.input} EUR - ${amount} XRP) came in. https://xrparrot.com/#${req.body.xrplTxPayout.hash}\n- XRParrot.com`
                // originator = '+447427513374'
              }
              if (refundSentOK) {
                msgBody = `Your payment (${req.body.amounts.input}EUR) is refunded to your bank account: ${req.body.bankTransfer.data.counterpartyAlias.value} due to a missing reference or sending account mismatch. \n\n- XRParrot.com`
              }
            } catch (e) { 
              console.log('TextMessage Prepare error', e.message)
              msgBody = '' 
            }
            if (msgBody !== '' && numberFormatted !== '') {
              messagebird.messages.create({
                originator: originator,
                recipients: [ numberFormatted ],
                body: msgBody
              }, function (err, r) {
                if (err) {
                  console.log(`<< TX RESULT TEXT MESSAGE: Error sending text message to ${numberFormatted}`)
                }
                console.log(`MSG: ${paymentSentOK ? 'OK' : 'REFUND'} sent to: ${numberFormatted}\n>> ${msgBody}`)
              })
            }
          }
        }
      })              
    } else {
      reject(new Error('Nah.'))
    }
  }).then(payment => {
    if (res instanceof Object) {
      res.json({ error: false, data: payment })
    }
    return true
  }).catch(e => {
    if (res instanceof Object) {
      res.json({ error: true, message: e.toString() })
    } else {
      console.log('! Insert payment-callback error:', e.toString())
    }
    return false
  })
}

module.exports = { get, cursor, set, approve, refund, process, processRefund, callback }