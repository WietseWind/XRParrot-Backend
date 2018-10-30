module.exports = (req, res) => {
  console.log(`<<< RECEIVED HOOK`);
  if (req.ipTrusted) {
    console.log(`    --> [[[ HOOK TRUSTED ]]]`);
    
    try {
      console.log('Hook [./payments] passthrough', require('./payments').set({
        orderMethod: 'push',
        body: [ req.body.NotificationUrl.object.Payment ],
        config: {},
        mongo: req.mongo
      }))
    } catch (e) {
      console.log('<< payments.set ERROR: [' + e.toString() + '] >>')
    }
    
    req.mongo.collection('hook').insertOne({
      mode: req.config.mode,
      trusted: req.ipTrusted,
      req: {
        ip: req.remoteAddress,
        route: req.routeType,
        url: req.url,
        headers: req.headers
      },
      moment: new Date(),
      data: req.body,
      flow: {
        reversal: null,
        payout: null,
        processed: null
      }
    }, function(err, r) {
      if (err) {
        console.log('    DB[HOOK]', err.toString())
      } else {
        console.log('    DB[HOOK]', r.insertedCount, r.insertedId)
      }
    })
  }

  res.json({ message: 'OK', trusted: req.ipTrusted })
}
