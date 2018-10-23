const ibantools = require('ibantools')

module.exports = (req, res) => {
  const iban = ibantools.electronicFormatIBAN(req.body instanceof Object && typeof req.body.iban !== 'undefined' ? req.body.iban : '')
  let valid = ibantools.isValidIBAN(iban)

  if (valid && (req.session.captcha || false) && ((req.session.step || -1) > 0)) {
    req.session.step = 2
    req.session.source = iban
  } else {
    console.log(`ERROR {{ INVALID @ ${req.session.id}:${__filename} }}`)
    valid = false
  }

  res.json({ message: 'IBAN Check', trusted: req.ipTrusted, valid: valid, iban: iban })
}
