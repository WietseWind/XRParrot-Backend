module.exports = async function (expressApp) {
  expressApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*') // TODO
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
}
