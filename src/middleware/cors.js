module.exports = async function (expressApp) {
  expressApp.use((req, res, next) => {
    let ValidOrigin = expressApp.config.AccessControlAllowOrigin || 'http://localhost:8080'
    res.header('Access-Control-Allow-Origin', ValidOrigin) // TODO
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
}
