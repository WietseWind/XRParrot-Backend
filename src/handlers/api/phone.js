const PNF = require('google-libphonenumber').PhoneNumberFormat
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
const messagebirdApi = require('messagebird')

module.exports = (req, res) => {
  const messagebird = messagebirdApi(req.config.messagebirdKey)

  // messagebird.balance.read(function (err, data) {
  //   if (err) {
  //     return console.log(err)
  //   }
  //   console.log(data)
  // })
  
  let phoneNumber

  let response = { 
    message: 'Phone check',
    trusted: req.ipTrusted,
    valid: false,
    input: null,
    parsedNumber: null,
    error: null
  }

  const activationCode = 1337123
  
  try {
    response.input = phoneNumber = (req.body instanceof Object && typeof req.body.phone !== 'undefined' ? req.body.phone + '' : '')
                      .trim()
                      .replace(/^([1-9])/, '00$1')
                      .replace(/\(0\)/, '')
                      .replace(/^00/, '+')
                      .replace(/[^0-9+]/g, '')
    let numberFormatted = response.parsedNumber = phoneUtil.format(phoneUtil.parseAndKeepRawInput(phoneNumber), PNF.E164)

    messagebird.messages.create({
      originator: 'XRParrot',
      type: 'flash',
      recipients: [ numberFormatted ],
      body: `Hi! Your activation code is ${activationCode} \n\n- XRParrot.com`
    }, function (err, r) {
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
    res.json(Object.assign(response, { 
      error: e.message
    }))
  }
}
