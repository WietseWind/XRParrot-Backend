const MongoClient = require('mongodb').MongoClient

module.exports = async function (expressApp) {
  const mongo = await new Promise((resolve, reject) => {
    MongoClient.connect(expressApp.config.mongo, {
      useNewUrlParser: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
      autoReconnect: true,
      keepAlive: true
    }, function (err, connection) {
      if (err) {
        reject(err)
      } else {
        console.log(`Connected to MongoDB [${expressApp.config.mongo}]`)
        connection.on('close', () => { console.log('DB -> Lost connection') })
        connection.on('reconnect', () => { console.log('DB -> Reconnected') })
        resolve(connection)
      }
    })
  })

  const dbName = mongo.db().s.databaseName

  expressApp.mongo = mongo.db(dbName).collection(dbName)
  expressApp.mongo.connection = mongo
  expressApp.mongo.collection = (collectionName) => {
    return mongo.db(dbName).collection(collectionName)
  }

  expressApp.use((req, res, next) => {
    req.mongo = expressApp.mongo
    next()
  })
}
