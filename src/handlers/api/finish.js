const crypto = require('crypto')

module.exports = async (req, res) => {
  const verifyInput = (typeof req.body !== 'undefined' && req.body instanceof Object && typeof req.body.verify !== 'undefined' ? req.body.verify + '' : '').replace(/[^0-9]/gi, '')
  let valid = false
  let msg = ''
  let details

  if (typeof req.session !== 'undefined' && typeof req.session.phone !== 'undefined' && req.session.phone.length > 0) {
    if ((req.session.codes || []).indexOf(verifyInput) > -1) {
      req.session.verified = true
      if (typeof req.session.verifiedPhone === 'undefined') {
        req.session.verifiedPhone = req.session.codeVsPhone[verifyInput + '']
      }
    } else {
      req.session.codeTries = (req.session.codeTries || 0) + 1
    }
  }

  if ((req.session.codeTries || 0) > 25) {
    msg = `Too many attempts. This session is blocked for further use.`
    valid = false
    console.log(`!! ${req.session.id}: ${msg}`)
  } else {
    if (req.session.verified) {
      valid = true
      const ud = crypto.createHash('md5').update(`${req.session.source}${req.session.destination.account}${req.session.destination.tag}${req.session.verifiedPhone}`).digest('hex')
      
      // If transfer details not yet generated, generate and return
      const orderIds = await require('../../storage/order')(req, ud)
      console.log('------------', orderIds)
      req.session.order = orderIds.string

      details = {
        bank: req.session.source,
        address: req.session.destination.account,
        tag: req.session.destination.tag,
        description: orderIds.string,
        phone: req.session.verifiedPhone
      }

      req.session.orderDetails = details

      await new Promise((resolve, reject) => {
        if (orderIds.generated) {
          req.mongo.collection('orders').insertOne({
            session: req.session,
            orderIds: orderIds,
            ip: req.remoteAddress,
            moment: new Date(),
            ud: ud,
            details: details
          }, function(err, r) {
            if (err) {
              reject(err)
            } else {
              console.log('DB[ORDER] ops Count', r.ops.length)
              resolve()
            }
          })
        } else {
          resolve()
        }
      }).then(() => {
        // req.session.order = orderIds
        console.log('-- ORDER INSERTED')
      }).catch(err => {
        console.log('DB[ORDER] >> ERROR', err.toString())
        valid = false
        msg = `Sorry, your order cannot be processed at this moment. Please try again later.`
      })
    } else {
      console.log('NOT VERIFIED')
    }
  }
  const jsonResponse = Object.assign({}, {
    input: verifyInput,
    valid: valid,
    msg: msg,
    details: details
  })
  console.log('<FINISH>', jsonResponse)
  res.json(jsonResponse)
}
