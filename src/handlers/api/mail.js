const mandrill = require('mandrill-api/mandrill')

module.exports = async (req, res) => {
  let mandrillClient = new mandrill.Mandrill(req.config.mandrillKey || '')
  const mailTo = (req.body instanceof Object && typeof req.body.to !== 'undefined' ? req.body.to + '' : '').trim()

  try {
    var message = {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <style type="text/css">
            /* FONTS */
            @media screen {
                @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 400;
                  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
                }
                
                @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 700;
                  src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
                }
                
                @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 400;
                  src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
                }
                
                @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 700;
                  src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
                }
            }
            
            /* CLIENT-SPECIFIC STYLES */
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; }
        
            /* RESET STYLES */
            img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            table { border-collapse: collapse !important; }
            body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
        
            /* iOS BLUE LINKS */
            a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }
            
            /* MOBILE STYLES */
            @media screen and (max-width:500px){
                h1 {
                    font-size: 32px !important;
                    line-height: 32px !important;
                }
            }
        
            /* ANDROID CENTER FIX */
            div[style*="margin: 16px 0;"] { margin: 0 !important; }
        </style>
        </head>
        <body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
        
        <!-- HIDDEN PREHEADER TEXT -->
        <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          Thank you for using XRParrot. Here's a copy of your order &amp; bank transfer details.
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <!-- LOGO -->
            <tr>
                <td bgcolor="#f4f4f4" align="center">
                    <!--[if (gte mso 9)|(IE)]>
                    <table align="center" border="0" cellspacing="0" cellpadding="0" width="500">
                    <tr>
                    <td align="center" valign="top" width="500">
                    <![endif]-->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px;" >
                        <tr>
                            <td align="center" valign="top" style="padding: 40px 00px 40px 00px;">
                                <a href="https://xrparrot.com" target="_blank">
                                    <img alt="Logo" src="https://jirt8wc.dlvr.cloud/logo.png" width="300" height="105" style="display: block; width: 300px; max-width: 300px; min-width: 300px; font-family: 'Lato', Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px;" border="0">
                                </a>
                            </td>
                        </tr>
                    </table>
                    <!--[if (gte mso 9)|(IE)]>
                    </td>
                    </tr>
                    </table>
                    <![endif]-->
                </td>
            </tr>
            <!-- HERO -->
            <tr>
                <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                    <!--[if (gte mso 9)|(IE)]>
                    <table align="center" border="0" cellspacing="0" cellpadding="0" width="500">
                    <tr>
                    <td align="center" valign="top" width="500">
                    <![endif]-->
                    <table bgcolor="#66BB7F" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px;" >
                        <tr>
                            <td bgcolor="#66BB7F" align="center" valign="top" style="padding: 20px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 400; line-height: 30px;">
                              <h1 style="font-size: 30px; line-height: 30px; font-weight: 400; margin: 0;">Order confirmation<br /><b>${req.session.orderDetails.description}</b></h1>
                            </td>
                        </tr>
                    </table>
                    <!--[if (gte mso 9)|(IE)]>
                    </td>
                    </tr>
                    </table>
                    <![endif]-->
                </td>
            </tr>
            <!-- COPY BLOCK -->
            <tr>
                <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                    <!--[if (gte mso 9)|(IE)]>
                    <table align="center" border="0" cellspacing="0" cellpadding="0" width="500">
                    <tr>
                    <td align="center" valign="top" width="500">
                    <![endif]-->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px;" >
                      <!-- COPY -->
                      <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;" >
                          <p style="margin: 0;">
                            Your Order ID is <b>${req.session.orderDetails.description}</b>.
                            You <b>must</b> add this ID to your payment to XRParrot.<br /><br />
                            Your Order ID is linked to your source IBAN and destination XRP adddres & tag. You <b>can use this ID again</b> for future payments.<br /><br />
                            If you forget this ID or if you want to change your payment source or XRP destination, you can simply generate a new ID.
                            <br /><br />
                            <b style="color: #207AF9;">Please transfer your money (min. €5, max. €500) to the account details displayed below.</b>
                            <br /><br />
                            After you have transferred the money it will take around one working day for your money to arrive at our bank. Immediately after your money arrives it will be converted and your XRP sent to you. We will send you a text message (SMS) when this happens.
                          </p>
                        </td>
                      </tr>
                      <!-- COPY -->
                      <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;" >
                        <h5 style="font-size: 20px; margin-top: 10px; padding-top: 15px; line-height: 20px;color: #207AF9;"><b>Payment details</b></h5>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">IBAN (Send money to)</small><br />
                              <b style="padding-left: 20px;">NL39 BUNQ 2291 4183 35</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px; color: #ca0000;">Payment reference (!!)</small><br />
                              <b style="padding-left: 20px; color: #ca0000;">${req.session.orderDetails.description}</b>
                              <br />
                              <b style="padding-left: 20px; font-size: 14px; color: #ca0000;">Please don't forget to include the payment reference!</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Account name</small><br />
                              <b style="padding-left: 20px;">XRParrot NL</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">BIC / Swift code</small><br />
                              <b style="padding-left: 20px;">BUNQNL2A</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Amount</small><br />
                              <b style="padding-left: 20px;">Min. &euro;5 per transaction, max. &euro;500 per month.</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Address, ZIP, city</small><br />
                              <b style="padding-left: 20px;">Tolweg 5, 3741 LM, Baarn</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Country</small><br />
                              <b style="padding-left: 20px;">The Netherlands (NL)</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Bank name</small><br />
                              <b style="padding-left: 20px;">Bunq Bank</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Bank address</small><br />
                              <b style="padding-left: 20px;">Naritaweg 131, 1043 BS Amsterdam (NL)</b>
                            </p>
                          <br />
                        <h5 style="font-size: 20px; margin-top: 10px; padding-top: 15px; line-height: 20px; color: #207AF9;"><b>Source &amp; destination</b></h5>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Sending IBAN (send only from this account!)</small><br />
                              <b style="padding-left: 20px;">${req.session.source}</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">XRP Destination</small><br />
                              <b style="padding-left: 20px;">${req.session.destination.account}</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Destination tag</small><br />
                              <b style="padding-left: 20px;">${(req.session.destination.tag === '' ? '-' : req.session.destination.tag) || '-'}</b>
                            </p>
                          <p style="margin: 0;">
                            <small style="font-size: 14px;">Your (verified) phone number</small><br />
                              <b style="padding-left: 20px;">${req.session.verifiedPhone}</b>
                            </p>
                        </td>
        
                      </tr>
                    </table>
                    <!--[if (gte mso 9)|(IE)]>
                    </td>
                    </tr>
                    </table>
                    <![endif]-->
                </td>
            </tr>
        </table>
        </body>
        </html>
      `,
      subject: `Your XRParrot order: ${req.session.orderDetails.description}`,
      from_email: 'hello@xrparrot.com',
      from_name: 'XRParrot.com',
      to: [ { email: mailTo, name: mailTo, type: 'to' }],
      headers: {
        'Reply-To': 'hello@xrparrot.com'
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
      tags: [ 'xrparrot' ]
    }
    // console.log(typeof req.session.orderMail)
    if (typeof req.session.orderMail === 'undefined') {
      req.session.orderMail = []
    }
    if (req.session.orderMail.length >= 10) {
      throw new Error(`Exceeded max. amount of mails sent (${req.session.orderMail.length})`)
    }
    mandrillClient.messages.send({ message: message, async: false }, result => {
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
