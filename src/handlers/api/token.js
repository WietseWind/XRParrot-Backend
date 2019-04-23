const fetch = require('node-fetch')

module.exports = async (req, res) => {
  let message = ''
  let data = null

  try {
    if (typeof req.body === 'object' && req.body !== null
      && Object.keys(req.body).indexOf('account') > -1
      && Object.keys(req.body).indexOf('tag') > -1
      && Object.keys(req.body).indexOf('token') > -1
    ) {
      let d = await fetch(`https://www.xrptipbot.com/json/deposittoken/token:${req.body.token}/account:${req.body.account}/tag:${req.body.tag}`)
      d = await d.json()
      if (typeof d === 'object' && d !== null && Object.keys(d).indexOf('handle') > -1) {
        data = d
        message = 'OK, hi ' + d.handle
      }
    }
  } catch (e) {
    message = 'Error: ' + e.message
  }

  res.json({ message: message, trusted: req.ipTrusted, response: data })
}
