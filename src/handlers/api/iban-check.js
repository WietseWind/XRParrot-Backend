const ibantools = require('ibantools')

module.exports = (req, res) => {
  const iban = ibantools.electronicFormatIBAN(req.body instanceof Object && typeof req.body.iban !== 'undefined' ? req.body.iban : '')
  const valid = ibantools.isValidIBAN(iban)

  res.json({ message: 'IBAN Check', trusted: req.ipTrusted, valid: valid, iban: iban })
}
