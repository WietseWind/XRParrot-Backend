const mandrill = require('mandrill-api/mandrill')

module.exports = async (req, res) => {
  let mandrillClient = new mandrill.Mandrill(req.config.mandrillKey || '')
  const mail = (req.body instanceof Object && typeof req.body.mail !== 'undefined' ? req.body.mail + '' : '').trim()
  const message = (req.body instanceof Object && typeof req.body.message !== 'undefined' ? req.body.message + '' : '').trim()
  const order = (req.body instanceof Object && typeof req.body.order !== 'undefined' ? req.body.order + '' : '').trim()
  const name = (req.body instanceof Object && typeof req.body.name !== 'undefined' ? req.body.name + '' : '').trim()
  let validMail = false
  if (mail.trim().match(/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i)) {
    validMail = true
  }
  const mailTo = 'support@xrparrot.com'

  if (typeof req.session.captcha === 'undefined' || req.session.captcha === false) {
    throw new Error('Session invalid, not verified (captcha)')
  }
  try {
    let mailMessage = {
      html: `
        <h3>Name, mail</h3>
        <p>${name} (${mail})</p>
        <h3>Order</h3>
        <p>${order})</p>
        <h3>Message</h3>
        <p>${message.replace(/\n/g, '<br />')})</p>
      `,
      subject: `XRParrot Support: ${name} - ${order}`,
      from_email: 'support@xrparrot.com',
      from_name: name,
      to: [ { email: mailTo, name: mailTo, type: 'to' }],
      headers: {
        'Reply-To': validMail ? mail : 'support@xrparrot.com'
      },
      important: false,
      track_opens: null,
      track_clicks: null,
      auto_text: null,
      auto_html: null,
      inline_css: null,
      url_strip_qs: null,
      preserve_recipients: null,
      view_content_link: null,
      tracking_domain: null,
      tags: [ 'xrparrot', 'support' ]
    }
    // console.log(typeof req.session.orderMail)
    mandrillClient.messages.send({ message: mailMessage, async: false }, result => {
      console.log('Mail sent', result)
      req.session.orderMail.push(result)
      res.json({ error: false, result: result })
    }, e => {
      let errorMsg = 'A mandrill error occurred: ' + e.name + ' - ' + e.message
      console.log(errorMsg)
      res.json({ error: true, message: errorMsg })
    })
  } catch (e) {
    console.log('MANDRILL ERROR', e.message)
    res.json({ error: true, message: e.message })
  }
  delete mandrillClient
  return
}
