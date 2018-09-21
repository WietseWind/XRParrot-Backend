const helmet = require('helmet')

module.exports = async function (expressApp) {
  expressApp.disable('x-powered-by')
  expressApp.use(helmet({
    referrerPolicy: { 
      policy: 'same-origin'
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com'],
        imgSrc: ["'self'", 'pp1ek9i.dlvr.cloud']
      }
    }
  }))
}
