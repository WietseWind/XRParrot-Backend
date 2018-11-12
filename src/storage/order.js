const { to } = require('../helpers/orderDescriptionEncoder')

module.exports = async (req, ud) => {
  const existingOrder = await new Promise((resolve, reject) => {
    req.mongo.collection('orders').findOne({
      ud: ud
    }, (err, r) => {
      if (err) {
        return resolve(false)
      }
      return resolve(r && r !== null && typeof r.details !== 'undefined' ? r.details.description : false)
    })
  })

  if (existingOrder) {
    console.log(`EXISTING ORDER [ ${ud} ]`, existingOrder)
    return new Promise((resolve, reject) => {
      resolve({ string: existingOrder, generated: false })
    })
  }
  
  if (typeof req.config.__incrementId === 'undefined') {
    // Get from Mongo
    req.config.__incrementId = await new Promise((resolve, reject) => {
      return req.mongo.collection('increment').findOne({ 
        incrementId: { '$exists': true }
      }, function(err, r) {
        if (err) {
          console.log('DB[INCREMENT<RECOVERY] >> ERROR', err.toString())
          reject(err)
        } else {
          console.log(':: INCREMENTID (<RECOVERED) ', r.incrementId)
          resolve(r.incrementId)
        }
      })
    })
  }

  const orderIdData = await new Promise((resolve, reject) => {
    req.config.__incrementId += Math.floor(Math.random() * (9 - 3 + 1) ) + 3
    if (req.config.__incrementId % 13 === 0) {
      // Fix 0 endless loop bug, can't change module because of existing ids
      req.config.__incrementId++
    }
    req.mongo.collection('increment').updateOne({ 
      incrementId: { '$exists': true }
    }, { 
      '$set': { incrementId: req.config.__incrementId },
      '$inc': { increments: 1 }
    }, { 
      writeConcern: {
        w: 'majority',
        j: true
      }
    }, (err, r) => {
      if (err) {
        console.log('DB[INCREMENT] >> ERROR', err.toString())
        reject(err)
      } else {
        console.log(':: INCREMENTID ', req.config.__incrementId)
        let ids = {
          id: req.config.__incrementId,
          checksum: to(req.config.__incrementId % 13),
          text: to(req.config.__incrementId)
        }
        ids.string = `${ids.id}.${ids.text}${ids.checksum}`
        ids.generated = true
        console.log('-- IDS RESOLVE', ids)
        resolve(ids)
      }
    })
  })
  
  console.log('-- Return orderIdData')
  return orderIdData
}