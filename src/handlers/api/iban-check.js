const ibantools = require('ibantools')

module.exports = (req, res) => {
  const iban = ibantools.electronicFormatIBAN(req.body instanceof Object && typeof req.body.iban !== 'undefined' ? req.body.iban : '')
  const valid = ibantools.isValidIBAN(iban)
  // req.mongo.collection('hook').insertOne({
  //   mode: req.config.mode,
  //   trusted: req.ipTrusted,
  //   req: {
  //     ip: req.remoteAddress,
  //     route: req.routeType,
  //     url: req.url,
  //     headers: req.headers
  //   },
  //   moment: new Date(),
  //   data: req.body,
  //   flow: {
  //     reversal: null,
  //     payout: null,
  //     processed: null
  //   }
  // }, function(err, r) {
  //   if (err) {
  //     console.log('DB[HOOK]', err.toString())
  //   } else {
  //     console.log('DB[HOOK]', r.insertedCount, r.insertedId)
  //   }
  // })
  res.json({ message: 'IBAN Check', trusted: req.ipTrusted, valid: valid, iban: iban })
}
