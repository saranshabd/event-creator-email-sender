'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const nodemailer = require('nodemailer')
const fs = require('fs')

// load configurations from environment
require('dotenv').config()

const app = express()

// use body-parser middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// use CORS middleware
app.use(cors())

/**
 * utility method to check if there are any empty strings
 */
function containsEmptyString(args) {
  for (let i = 0; i < args.length; ++i)
    if (undefined === args[i] || '' === args[i]) return true
  return false
}

/**
 * route to send emails to service providers regarding new registered events
 */
app.post('/event-creator/service-provider/send-email', (request, response) => {
  const { date, title, venue, handler, handlerEmail } = request.body

  // check for invalid arguments
  if (containsEmptyString([date, title, venue, handler, handlerEmail]))
    return response
      .status(400)
      .json({ status: false, message: 'invalid arguments' })

  // get email sender configurations
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    secureConnection: false,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      ciphers: 'SSLv3'
    }
  })

  // get email template
  let template = fs.readFileSync('./emails/template.html').toString()

  // fill the template with real values
  template = template.replace('@@name@@', title)
  template = template.replace('@@date@@', date)
  template = template.replace('@@venue@@', venue)
  template = template.replace('@@serviceprovider@@', handler)

  // send email using the above template
  transport
    .sendMail({
      from: 'Mext',
      to: handlerEmail,
      subject: 'Event Notification - Mext',
      html: template
    })
    .then(() => {
      response
        .status(200)
        .json({ status: true, message: 'email sent successfully' })
    })
    .catch(error => {
      console.log(error)
      response
        .status(500)
        .json({ status: false, message: 'internal server error' })
    })
})

const port = process.env.PORT || 2323
app.listen(port, () => console.log(`server is up and running at port ${port}`))
