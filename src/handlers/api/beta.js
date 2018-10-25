module.exports = async (req, res) => {
  const code = (req.body instanceof Object && typeof req.body.code !== 'undefined' ? req.body.code + '' : '')
  let valid = false

  await new Promise((resolve, reject) => {
    return req.mongo.collection('betacodes').findOne({ 
      code: code
    }, function(err, r) {
      if (err) {
        reject(err)
      } else {
        if (r) {
          resolve({ valid: true })
        } else {
          resolve({ valid: false })
        }
      }
    })
  }).then(r => {
    res.json(r)
  }).catch(r => {
    console.log('BETA CODE ERROR', r.message)
    res.json({ valid: false, error: true })
  })
}
