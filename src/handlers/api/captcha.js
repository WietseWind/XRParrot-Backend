const fetch = require('node-fetch')
const FormData = require('form-data')

module.exports = (req, res) => {
  // throw new Error("BROKEN")
  // console.log('CAPTCHA', req.body.token)
  const form = new FormData();
  form.append('secret', req.config.captchaToken || '')
  form.append('response', req.body instanceof Object && typeof req.body.token !== 'undefined' ? req.body.token : '')
  form.append('remoteip', req.remoteAddress)

  fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: form })
    .then(res => res.json())
    .then(json => {
      console.log(`-- Captcha Response ${json.score || 0} (${json.success ? 'OK' : 'ERR'}) @ ${req.session.id}`)
      if (json.success && json.score >= 0.3) {
        req.session.captcha = true
      }
      const order = (req.session.verified || false) ? (req.session.order || '') : null 
      res.json({ 
        message: 'Captcha received', 
        trusted: req.ipTrusted, 
        response: json, 
        order: order,
        transferDetails: order ? { details: req.session.orderDetails } : { details: {} }
      })
    })
}
