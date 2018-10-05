const session = require('express-session');
const MongoStore = require('connect-mongo')(session)

module.exports = async function (expressApp) {
  if (expressApp.config.mode === 'production') {
    expressApp.set('trust proxy', true) // trust first proxy
  }

  expressApp.use(session({
    name: 'xrparrotSId',
    secret: expressApp.config.sessionSecret,
    resave: false, //don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    cookie: {
      secure: expressApp.config.mode === 'production',
      httpOnly: true,
      sameSite: expressApp.config.CookieSameSite || null,
      domain: expressApp.config.CookieDomain || null,
      maxAge: null
    },
    store: new MongoStore({
      url: `${expressApp.config.mongo}_sessions`,
      autoRemove: 'native',
      autoRemoveInterval: 10, // In minutes. Default
      touchAfter: 30, // time period in seconds
      stringify: false,
      fallbackMemory: false,
      ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    })
  }))
}
