module.exports = (req, res) => {
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
      console.log('DB[HOOK]', err.toString())
    } else {
      console.log('DB[HOOK]', r.insertedCount, r.insertedId)
    }
  })

  // let inc
  // req.mongo.collection('hook').findAndModifyOne({
  //   orders: true
  // }, {
  //   '$inc': {
  //     id: 1
  //   }
  // }, { 
  //   upsert: true,
  //   projection: {
  //     id: true
  //   },
  //   writeConcern: 'majority'
  // }, function(err, r) {
  //   inc = r
  //   if (err) {
  //     console.log('DB[INC]', err.toString())
  //   } else {
  //     console.log('DB[INC]', r.toString())
  //   }
  // })

  res.json({ 
    message: 'Hook received', 
    trusted: req.ipTrusted,
    // inc: inc
  })
}
