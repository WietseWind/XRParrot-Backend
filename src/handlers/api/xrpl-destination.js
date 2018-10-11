const fetch = require('node-fetch')
const rippleAddressCodec = require('ripple-address-codec')
const xrplClient = require('rippled-ws-client')

module.exports = async (req, res) => {
  let message = 'XPRL Destination'
  let exception = false

  let account = req.body.account || ''
  let tag = req.body.tag ? (parseInt(req.body.tag) || null) : null
  let addressValid = rippleAddressCodec.isValidAddress(account)
  let accountInfo = {}
  let accountFlags = []
  let tagRequired = false
  let accountActivated = false

  // fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: form })
  //   .then(res => res.json())
  //   .then(json => {
  //     console.log(`-- Captcha Response ${json.score || 0} (${json.success ? 'OK' : 'ERR'}) @ ${req.session.id}`)
  //     if (json.success && json.score > 0.5) {
  //       req.session.captcha = true
  //     }
  //     res.json({ message: 'Captcha received', trusted: req.ipTrusted, response: json })
  //   })

  if (addressValid) {
    await new Promise(resolve => {
      const Server = 'rippled.xrptipbot.com'
      const finish = (response, connection) => {
        if (typeof response !== 'string') {
          accountInfo = response
          if (typeof accountInfo.Balance === 'string') {
            accountActivated = true
          }
          if (typeof response.Flags !== 'undefined') {
            const accountRootFlags = {
              PasswordSpent: 0x00010000, // password set fee is spent
              RequireDestTag: 0x00020000, // require a DestinationTag for payments
              RequireAuth: 0x00040000, // require authorization to hold IOUs
              DepositAuth: 0x01000000, // require account to auth deposits
              DisallowXRP: 0x00080000, // disallow sending XRP
              DisableMaster: 0x00100000, // force regular key
              NoFreeze: 0x00200000, // permanently disallowed freezing trustlines
              GlobalFreeze: 0x00400000, // trustlines globally frozen
              DefaultRipple: 0x00800000
            }
            Object.keys(accountRootFlags).forEach(f => {
              if (response.Flags & accountRootFlags[f]) {
                accountFlags.push(f)
                if (f === 'RequireDestTag') {
                  tagRequired = true
                }
              }
            })
          }

          resolve()
        } else {
          exception = true
          message = response
          resolve()
        }
        if (typeof connection !== 'undefined') {
          connection.close().then(console.log(`-- WSS Connection closed`)).catch(e => console.log(e.message))
        }
      }
      new xrplClient('wss://' + Server).then(Connection => {
        console.log(`<< WSS: Connected to [ ${Server} ] >>`)
      
        Connection.on('error', error => console.log('WSS EVENT=error: Error', error))
        // Connection.on('state', (stateEvent) => console.log('EVENT=state: State is now', stateEvent))
        // Connection.on('retry', (retryEvent) => console.log('EVENT=retry: << Retry connect >>', retryEvent))
        // Connection.on('reconnect', (reconnectEvent) => console.log('EVENT=reconnect: << Reconnected >>', reconnectEvent))
        // Connection.on('close', (closeEvent) => console.log('EVENT=close: Connection closed', closeEvent))
        // Connection.on('ledger', (ledgerInfo) => console.log('EVENT=ledger: ledgerInfo:', ledgerInfo))
        // Connection.on('transaction', (transaction) => console.log('EVENT=transaction: transaction:', transaction))
        // Connection.on('validation', (validation) => console.log('EVENT=validation: validation', validation))
      
        Connection.send({
          command: 'account_info',
          account: account
        }).then(r => {
          console.log('   >> WSS Response', req.config.mode === 'development' ? r : '')
          if (typeof r === 'object' && r.account_data !== 'undefined') {
            finish(r.account_data, Connection)
          } else {
            finish(`Account not found.`, Connection)
          }
        }).catch(e => {
          console.log('WSS Catch', e)
          finish(`Couldn't fetch account info from rippled.`, Connection)
        })
      }).catch(e => {
        console.log(`!! WSS: Couldn\'t connect`, e)
        finish(`Couldn't connect to rippled.`)
      })
    })
  }

  let accountNameInfo = {}
  let valid = false

  if (addressValid && accountActivated) {
    await new Promise(resolve => {
      fetch('https://bithomp.com/api/v1/userinfo/' + account, { method: 'GET' })
        .then(res => res.json())
        .then(json => {
          console.log(`-- AccountInfo [BITHOMP API] @ ${req.session.id}`, json)
          accountNameInfo = json
          resolve()
        })
        .catch(e => console.log(`BITHOMP API ERROR`, e))
    })
  }

  let data = {
    accountInfo: accountInfo,
    accountFlags: accountFlags,
    account: account,
    tag: tag,
    addressValid: addressValid,
    tagRequired: tagRequired,
    tagValid: !tagRequired || (tagRequired && tag && tag !== null && tag > 0),
    accountActivated: accountActivated,
    accountNameInfo: accountNameInfo,
    valid: valid
  }

  res.json({ message: message, trusted: req.ipTrusted, exception: exception, response: data })
}
