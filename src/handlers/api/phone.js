const PNF = require('google-libphonenumber').PhoneNumberFormat
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
const messagebirdApi = require('messagebird')
const ttl = 10 // Minutes before new text message will be sent

module.exports = (req, res) => {
  const messagebird = messagebirdApi(req.config.messagebirdKey)

  // messagebird.balance.read(function (err, data) {
  //   if (err) {
  //     return console.log(err)
  //   }
  //   console.log(data)
  // })

  if (typeof req.session.source === 'undefined' || typeof req.session.captcha === 'undefined' || typeof req.session.destination === 'undefined') {
    console.log(`ERROR {{ INVALID @ ${req.session.id}:${__filename} }}`)
    return res.json(Object.assign({}, {
      invalidNo: true,
      error: 'Invalid session: not all previous steps are completed.'
    }))
  }
  
  let phoneNumber

  let response = { 
    message: 'Phone check',
    trusted: req.ipTrusted,
    valid: false,
    input: null,
    parsedNumber: null,
    error: null
  }

  const activationCode = Math.random().toFixed(6).split('.')[1]
  
  try {
    response.input = phoneNumber = (req.body instanceof Object && typeof req.body.phone !== 'undefined' ? req.body.phone + '' : '')
                      .trim()
                      .replace(/^([1-9])/, '00$1')
                      .replace(/\(0\)/, '')
                      .replace(/^00/, '+')
                      .replace(/[^0-9+]/g, '')
    let numberFormatted = response.parsedNumber = phoneUtil.format(phoneUtil.parseAndKeepRawInput(phoneNumber), PNF.E164)

    if (typeof req.session.phone !== 'undefined' && req.session.phone.length > 0) {
      let recentTtlRecords = req.session.phone.filter(r => {
        return r.ts > (Math.floor(Date.now() / 1000) - 60 * ttl)
      })
      let existingTexts = recentTtlRecords.filter(r => {
        return r.no === numberFormatted && r.err === null
      })
      let msg = ''
      if (existingTexts.length > 0) {
        // Already sent
        msg = `Message to ${numberFormatted} has already been sent.\n\nPlease wait ~${ttl} minutes for the message to arrive, or try again.`
      }
      let existingNumbers = recentTtlRecords.filter(r => { return r.err === null }).map(r => { return r.no })
      if (recentTtlRecords.filter(r => { return r.err === null }).length > 2) {
        // 3 numbers tried, max.
        msg = `The maximum number of messages has been sent. Messages have been sent to:\n\n${existingNumbers.join(`\n`)}`
      }
      if ((req.session.codeTries || 0) > 25) {
        msg = `Too many attempts. This session is blocked for further use.`
      }
      if (typeof req.session.verified !== 'undefined') {
        // Already verified
        msg = 'This session is already verified :)'
        existingNumbers = [ numberFormatted ]
        response.valid = true
        response.verified = true
      }
      if (msg !== '') {
        res.json(Object.assign(response, { 
          error: msg,
          existingNumbers: existingNumbers
        }))
        return console.log(msg)
      }
    }

    messagebird.messages.create({
      originator: 'XRParrot',
      // type: 'flash',
      recipients: [ numberFormatted ],
      body: `Hi! Your activation code is ${activationCode} \n\n- XRParrot.com`
    }, function (err, r) {
      if (typeof req.session.phone === 'undefined') req.session.phone = []
      if (typeof req.session.codes === 'undefined') req.session.codes = []
      if (typeof req.session.codeVsPhone === 'undefined') req.session.codeVsPhone = {}

      req.session.phone.push({
        no: numberFormatted,
        err: err,
        res: r,
        code: activationCode,
        ts: Math.floor(Date.now() / 1000)
      })

      req.session.codes.unshift(activationCode)
      req.session.codes = req.session.codes.slice(0, 15) // Save max. 15 codes in the session
      req.session.codeVsPhone[activationCode + ''] = numberFormatted

      if (err) {
        res.json(Object.assign(response, { 
          error: `Error sending text message to ${numberFormatted}`
        }))
        return console.log(err)
      }

      console.dir(r, { depth: null })
      res.json(Object.assign(response, { 
        valid: true
        // msgId: r.id
      }))
    })
  } catch (e) {
    const jsonResponse = Object.assign(response, {
      invalidNo: true,
      error: e.message
    })
    console.log('<<PHONE>>', jsonResponse)
    res.json(jsonResponse)
  }
}
