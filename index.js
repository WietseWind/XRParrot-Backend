const express = require('express')
const app = express()

async function start () {
  const config = await require('./src/middleware/config')(app)

  await require('./src/storage/mongodb')(app)
  await require('./src/storage/session')(app)
  await require('./src/middleware/cors')(app)
  await require('./src/middleware/what-router')(app)
  await require('./src/middleware/remote-addr')(app)  
  await require('./src/middleware/cli-logger')(app)  
  await require('./src/handlers/web')(app)
  await require('./src/handlers/api')(app)

  app.listen(config.port)

  console.log(`XRParrot ${config.mode} - Server running at port ${config.port}`)
}

start()

process.on('SIGINT', async () => {
  console.log('--- STOPPING ---')
  if (typeof app.mongo === 'object' && typeof app.mongo.connection === 'object' && typeof app.mongo.connection.close === 'function') {
    await app.mongo.connection.close()
    console.log('    > DB connection closed')
  }
  process.exit(0)
})
