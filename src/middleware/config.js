const fs = require("fs")
const path = require('path')

const config = {
  port: process.env.PORT || 3001,
  mode: process.env.NODE_ENV || 'development',
  mongo: process.env.MONGO || 'mongodb://127.0.0.1:20000/xrparrot'
}

module.exports = async function (expressApp) {
  let loadedConfig = {}
  
  await new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, `../../${config.mode}.json`), (err, data) => {
      if (err) {
        reject(new Error('CONFIG FILE ERROR:', err.toString()))
      } else {
        try {
          loadedConfig = JSON.parse(data.toString('utf8'))
          resolve(loadedConfig)
        } catch (e) {
          reject(new Error('CONFIG FILE PARSE ERROR', e.toString()))
        }
      }
    })
  })
  
  // Apply config to Express
  expressApp.config = Object.assign(config, loadedConfig)
  expressApp.use((req, res, next) => {
    req.config = expressApp.config
    next()
  })

  return expressApp.config
}
