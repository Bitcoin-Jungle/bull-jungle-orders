import express from "express"
import { Telegraf } from "telegraf"
import bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import { GoogleSpreadsheet } from 'google-spreadsheet'

dotenv.config()

const telegram_bot_token = process.env.telegram_bot_token
const port = process.env.port
const chat_id = process.env.chat_id
const base_path = process.env.base_path
const api_key = process.env.api_key
const google_sheet_id = process.env.google_sheet_id
const service_account_json = (process.env.service_account_json_base64 ? JSON.parse(Buffer.from(process.env.service_account_json_base64, 'base64').toString()) : null)
const service_account_email = process.env.service_account_email

const bot = new Telegraf(telegram_bot_token)
const app = express()

const doc = new GoogleSpreadsheet(google_sheet_id);

app.use(bodyParser.json())

app.post('/order', async (req, res) => {
  const apiKey = req.body.apiKey
  const fiatAmount = (req.body.fiatAmount ? parseFloat(req.body.fiatAmount.replace(/,/g, "")) : null)
  const fiatCurrency = (req.body.fiatCurrency ? req.body.fiatCurrency.toUpperCase() : null)
  const satAmount  = parseInt(req.body.satAmount)
  const direction  = (req.body.direction ? req.body.direction.toUpperCase() : null)
  const paymentReq = (req.body.paymentReq ? req.body.paymentReq : null)

  if(!apiKey) {
    return res.send({error: true, message: "apiKey is required"})
  }

  if(apiKey !== api_key) {
    return res.send({error: true, message: "apiKey is incorrect"})
  }

  if(!fiatAmount) {
    return res.send({error: true, message: "fiatAmount is required"})
  }

  if(!fiatCurrency) {
    return res.send({error: true, message: "fiatCurrency is required"})
  }

  if(fiatCurrency !== 'USD' && fiatCurrency !== 'CRC') {
    return res.send({error: true, message: "fiatCurrency must be USD or CRC"})
  }

  if(!satAmount) {
    return res.send({error: true, message: "satAmount is required"})
  }

  if(!direction) {
    return res.send({error: true, message: "direction is required"})
  }

  if(!paymentReq) {
    return res.send({error: true, message: "paymentReq is required"})
  }

  if(direction !== 'BUY' && direction !== 'SELL') {
    return res.send({error: true, message: "direction should be buy or sell"})
  }

  if(direction === 'BUY' && paymentReq.toLowerCase().indexOf('lnbc') !== 0) {
    return res.send({error: true, message: "paymentReq must start with lnbc when buying"})
  }

  const fiatFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: fiatCurrency,
  })

  await doc.useServiceAccountAuth({
    client_email: service_account_email,
    private_key: service_account_json.private_key,
  })

  await doc.loadInfo()

  const sheet = doc.sheetsByIndex[0]

  const newRow = await sheet.addRow({ 
    "Type": "TEST",
    "From currency": "TEST",
    "From amount": "TEST",
    "To Currency": "TEST",
    "TO AMOUNT": "TEST",
    "Payment type": "TEST",
    "Biller": "TEST",
    "Account Number": "TEST",
    "LN Invoice": "TEST",
    "USD/CRC": "TEST",
    "CRC/USD": "TEST",
    "USD/CAD": "TEST",
    "EFFECTIVE RATE (TO CURRENCY)": "TEST",
    "USD RATE": "TEST",
    "CAD RATE": "TEST",
  })

  let message = `🚨 ${direction} Order 🚨\n`
  message += `Fiat Amount: ${fiatFormatter.format(fiatAmount)}\n`
  message += `Sat Amount: ${Number(satAmount).toLocaleString()}\n`
  message += `Payment Destination: ${paymentReq}`

  const resp = await bot.telegram.sendMessage(chat_id, message)

  res.send({success: true})
})

app.get('/order', (req, res) => {
  res.sendFile('order/index.html', {root: base_path})
})

app.listen(port, () => console.log("Listening on port", port))