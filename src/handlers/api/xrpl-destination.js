const fetch = require('node-fetch')
const rippleAddressCodec = require('ripple-address-codec')
const xrplClient = require('rippled-ws-client')

module.exports = async (req, res) => {
  let message = 'XPRL Destination'
  let exception = false

  let account = (req.body.account || '').split(':').reverse()[0].replace(/[^a-zA-Z0-9]/gi, '')
  let tag = req.body.tag ? (parseInt(req.body.tag.replace(/[^0-9]/gi, '')) || null) : null
  let addressValid = rippleAddressCodec.isValidAddress(account)
  let accountInfo = {}
  let accountFlags = []
  let tagRequired = false
  let accountActivated = false
  let doNotSendXrp = false
  let incomingTxCountWithTag = null

  if (addressValid) {
    await new Promise(resolve => {
      const Server = 'rippled.xrptipbot.com'
      const finish = (response, connection) => {
        if (typeof response !== 'string') {
          accountInfo = response
          resolve()
        } else {
          exception = true
          message = response
          resolve()
        }
        if (typeof connection !== 'undefined') {
          connection.close().then(console.log(`-- WSS Connection closed`)).catch(e => console.log(e.message))
        }
        return
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
        }).then(async r => {
          console.log('   >> WSS Response', req.config.mode === 'development' ? r : '')
          if (typeof r === 'object' && r.account_data !== 'undefined') {
            if (typeof r.account_data.Balance === 'string') {
              accountActivated = true
            }
            if (typeof r.account_data.Flags !== 'undefined') {
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
                if (r.account_data.Flags & accountRootFlags[f]) {
                  accountFlags.push(f)
                  if (f === 'RequireDestTag') tagRequired = true
                  if (f === 'DisallowXRP' || f === 'DepositAuth') doNotSendXrp = true
                }
              })
            }
            if (!tagRequired) {
              await Connection.send({
                command: 'account_tx',
                account: account
              }).then(txs => {
                if (typeof txs.transactions !== 'undefined' && txs.transactions && txs.transactions.length > 0) {
                  incomingTxCountWithTag = txs.transactions.filter(tx => {
                    return typeof tx.tx.TransactionType === 'string'
                      && tx.tx.TransactionType === 'Payment'
                      && typeof tx.tx.DestinationTag !== 'undefined'
                      && (tx.tx.DestinationTag + '') !== '0'
                      && tx.tx.Destination === account
                  }).length
                }
              })
            }
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

  if (addressValid && accountActivated) {
    await new Promise(resolve => {
      fetch('https://bithomp.com/api/v1/userinfo/' + account, { method: 'GET' })
        .then(res => res.json())
        .then(json => {
          console.log(`-- AccountInfo [BITHOMP API] @ ${req.session.id}`, json)
          if (typeof json.error === 'undefined') {
            accountNameInfo = json
          }
          return resolve()
        })
        .catch(e => console.log(`BITHOMP API ERROR`, e))
    })
  }

  let tagValid = !tagRequired || (tagRequired && tag && tag !== null && tag > 0)
  let valid = true

  if (!tagValid) valid = false
  if (!addressValid) valid = false
  if (doNotSendXrp) valid = false

  let data = {
    accountInfo: accountInfo,
    accountFlags: accountFlags,
    account: account,
    tag: tag,
    addressValid: addressValid,
    tagRequired: tagRequired,
    tagValid: tagValid,
    accountActivated: accountActivated,
    accountNameInfo: accountNameInfo,
    incomingTxCountWithTag: incomingTxCountWithTag,
    doNotSendXrp: doNotSendXrp,
    valid: valid
  }

  if (valid && (req.session.captcha || false) /* && typeof req.session.betaInvitation !== 'undefined'*/) {
    req.session.step = 1
    req.session.destination = {
      account: account,
      tag: tag
    }
  } else {
    console.log(`ERROR {{ INVALID @ ${req.session.id}:${__filename} }}`)
    data.valid = false
    exception = true
    message = 'Invalid session.'
  }

  res.json({ message: message, trusted: req.ipTrusted, exception: exception, response: data })
}
