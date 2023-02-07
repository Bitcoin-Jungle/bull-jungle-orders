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
  const action  = (req.body.action ? req.body.action.toUpperCase() : null)
  let paymentReq = (req.body.paymentReq ? req.body.paymentReq : null)
  
  const billerCategory = req.body.billerCategory
  const billerService = req.body.billerService
  const billerActionType = req.body.billerActionType
  const billerAccountNumber = req.body.billerAccountNumber

  if(action === 'BILLPAY') {
    paymentReq = 'Bill Payment'
  }

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

  if(!action) {
    return res.send({error: true, message: "action is required"})
  }

  if(!paymentReq) {
    return res.send({error: true, message: "paymentReq is required"})
  }

  if(action !== 'BUY' && action !== 'SELL' && action !== 'BILLPAY') {
    return res.send({error: true, message: "action should be buy or sell or billpay"})
  }

  if(action === 'BUY' && paymentReq.toLowerCase().indexOf('lnbc') !== 0) {
    return res.send({error: true, message: "paymentReq must start with lnbc when buying"})
  }

  if(action === 'BILLPAY' && (!billerCategory || !billerService || !billerActionType || !billerAccountNumber)) {
    return res.send({error: true, message: "When action is BILLPAY, you must provide billerCategory, billerService, billerActionType, billerAccountNumber"})
  }

  const fiatFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: fiatCurrency,
  })

  const satAmountFormatted = Number(satAmount).toLocaleString()
  const fiatAmountFormatted = Number(fiatAmount).toLocaleString()

  let fromCurrency = null
  let fromAmount = null
  let toCurrency = null
  let toAmount = null
  let paymentType = null
  let paymentDestination = null
  let formulaFreeAmount = (satAmount / 100000000).toFixed(8)

  switch(action) {
    case 'BUY':
      fromCurrency = fiatCurrency
      fromAmount = fiatAmountFormatted

      toCurrency = 'BTC'
      toAmount = `=(${satAmount} / 100000000)`

      paymentType = 'Buy BTC'

      paymentDestination = paymentReq
      
      break;

    case 'SELL':
    case 'BILLPAY':
      fromCurrency = 'BTC'
      fromAmount = `=(${satAmount} / 100000000)`

      toCurrency = fiatCurrency
      toAmount = fiatAmountFormatted

      paymentType = 'Sell BTC'

      paymentDestination = paymentReq

      break;

    default:
      console.log('no buy nor sell uh-oh')
      break;
  }

  await doc.useServiceAccountAuth({
    client_email: service_account_email,
    private_key: service_account_json.private_key,
  })

  await doc.loadInfo()

  const sheet = doc.sheetsByIndex[0]

  const rowData = { 
    "Type": action,
    "From Currency": fromCurrency,
    "From Amount": fromAmount,
    "To Currency": toCurrency,
    "To Amount": toAmount,
    "Payment Type": paymentType,
    "Payment Destination": paymentDestination,
    "Biller Category": billerCategory,
    "Biller Service": billerService,
    "Biller Action Type": billerActionType,
    "Biller Account Number": billerAccountNumber,
  }

  const newRow = await sheet.addRow(rowData)

  let message = `🚨 New Order 🚨\n`

  Object.keys(rowData).forEach(key => {
    let val = rowData[key]

    if(val && val.length) {
      if(val[0] === '=') {
        val = formulaFreeAmount
      }

      message += `${key}: ${val}\n`
    }
  })

  const resp = await bot.telegram.sendMessage(chat_id, message)

  res.send({success: true})
})

app.get('/order', (req, res) => {
  res.sendFile('order/index.html', {root: base_path})
})

app.listen(port, () => console.log("Listening on port", port))