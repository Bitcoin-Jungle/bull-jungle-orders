import express from "express"
import compression from 'compression'
import { Telegraf } from "telegraf"
import bodyParser from 'body-parser'
import cors from 'cors'
import * as dotenv from 'dotenv'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import axios from 'axios'
import { SocksProxyAgent } from 'socks-proxy-agent'
import serveStatic from 'serve-static'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import ibantools from 'ibantools'
import { EventEmitter } from 'events'

import * as ridivi from "./ridivi.js"

dotenv.config()

const telegram_bot_token = process.env.telegram_bot_token
const port = process.env.port
const chat_id = process.env.chat_id
const base_path = process.env.base_path
const api_key = process.env.api_key
const google_sheet_id = process.env.google_sheet_id
const service_account_json = (process.env.service_account_json_base64 ? JSON.parse(Buffer.from(process.env.service_account_json_base64, 'base64').toString()) : null)
const service_account_email = process.env.service_account_email
const exchange_rate_api_key = process.env.exchange_rate_api_key
const invoice_endpoint_url = process.env.invoice_endpoint_url
const invoice_endpoint_user = process.env.invoice_endpoint_user
const invoice_endpoint_password = process.env.invoice_endpoint_password
const price_data_url = process.env.price_data_url
const db_location = process.env.db_location
const admin_api_key = process.env.admin_api_key
const sparkwallet_url = process.env.sparkwallet_url
const sparkwallet_user = process.env.sparkwallet_user
const sparkwallet_password = process.env.sparkwallet_password
const ridivi_id = process.env.ridivi_id
const ridivi_crc_account = process.env.ridivi_crc_account
const ridivi_usd_account = process.env.ridivi_usd_account
const ridivi_sinpe_number = process.env.ridivi_sinpe_number
const ridivi_name = process.env.ridivi_name

const corsOptions = {
  origin: process.env.NODE_ENV !== "production" ? 'http://localhost:3001' : 'https://orders.bitcoinjungle.app',
}

// connect to the db
const db = await open({
  filename: db_location,
  driver: sqlite3.Database
})

const serviceAccountAuth = new JWT({
  // env var values here are copied from service account credentials generated by google
  // see "Authentication" section in docs for more info
  email: service_account_email,
  key: service_account_json.private_key,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
})

const doc = new GoogleSpreadsheet(google_sheet_id, serviceAccountAuth)

await doc.loadInfo()

console.log('loaded doc', doc.title)

const bot = new Telegraf(telegram_bot_token)
const app = express()

const googleSheetEventHandler = new EventEmitter()
const telegramEventHandler = new EventEmitter()

let BTCCRC, USDCRC, USDCAD, BTCUSD, BTCCAD

googleSheetEventHandler.on('addRow', async ({rowData, sheet: sheetIndex}) => {
  console.log('adding row to sheet ' + sheetIndex)

  const added = await addRowToSheet(rowData, sheetIndex)

  if(!added) {
    await new Promise(resolve => setTimeout(resolve, 1000 * 10))
    return await addRowToSheet(rowData, sheetIndex)
  }

  return true
})

telegramEventHandler.on('sendMessage', async ({rowData, formulaFreeAmount, bolt11, timestamp}) => {
  console.log('sending tg message')
  
  const telegramMessage = await sendOrderToTelegram(rowData, formulaFreeAmount, bolt11, timestamp)

  if(!telegramMessage) {
    await new Promise(resolve => setTimeout(resolve, 1000 * 10))
    await sendOrderToTelegram(rowData, formulaFreeAmount, bolt11, timestamp)
  }

  return true
})

app.use(bodyParser.json())
app.use(compression())
app.use(cors(corsOptions))
app.use(async (req, res, next) => {
  if(req.path === '/' && !req.query.registered) {
    const isBj = !!res.req.headers['x-bj-wallet'] || !!req.query.fromBJ
    const username = res.req.query.username

    if(isBj && username) {
      const userRegistered = await getUser(db, username)

      if(!userRegistered || !userRegistered.approved) {
        return res.redirect('/?' + new URLSearchParams({...req.query, registered: false}).toString())
      } else {
        return res.redirect('/?' + new URLSearchParams({...req.query, registered: true}).toString())
      }
    }
  }

  next()
})
app.use(serveStatic('front_end/build', { 'index': ['index.html'] }))

app.post('/order', async (req, res) => {
  const apiKey = req.body.apiKey
  const fiatAmount = (req.body.fiatAmount ? parseFloat(req.body.fiatAmount.replace(/,/g, "")) : null)
  const fiatCurrency = (req.body.fiatCurrency ? req.body.fiatCurrency.toUpperCase() : null)
  const satAmount  = (req.body.satAmount ? parseInt(req.body.satAmount.replace(/,/g, "").replace(/\./g, "")) : null)
  const action  = (req.body.action ? req.body.action.toUpperCase() : null)
  let paymentReq = (req.body.paymentReq ? req.body.paymentReq : null)
  const phoneNumber = (req.body.phoneNumber ? req.body.phoneNumber.replace(/[^\d]+/g, "").trim() : null)
  const timestamp = (req.body.timestamp ? req.body.timestamp : new Date().toISOString())
  const invoice = (req.body.invoice ? req.body.invoice : null)
  const paymentHash = (req.body.paymentHash ? req.body.paymentHash : null)
  const paymentIdentifier = (req.body.paymentIdentifier && req.body.action === "BUY" ? req.body.paymentIdentifier : "")
  
  const billerCategory = req.body.billerCategory
  const billerService = req.body.billerService
  const billerActionType = req.body.billerActionType
  const billerAccountNumber = req.body.billerAccountNumber

  if(action === 'BILLPAY') {
    paymentReq = 'Bill Payment'
  }

  const orderInFlight = await getOrder(db, timestamp)

  if(orderInFlight) {
    if(orderInFlight.status === 'complete') {
      return res.send({success: true})
    }

    if(orderInFlight.status === 'in-flight') {
      return res.send({inFlight: true})
    }
  }

  console.log('order received', req.body)

  if(!apiKey) {
    return res.send({error: true, type: "apiKeyRequired"})
  }

  if(apiKey !== api_key) {
    return res.send({error: true, type: "apiKeyIncorrect"})
  }

  if(!fiatAmount) {
    return res.send({error: true, type: "fiatAmountRequired"})
  }

  if(!fiatCurrency) {
    return res.send({error: true, type:"fiatCurrencyRequired"})
  }

  if(fiatCurrency !== 'USD' && fiatCurrency !== 'CRC') {
    return res.send({error: true, type: "invalidFiatCurrency"})
  }

  if(!satAmount) {
    return res.send({error: true, type: "satAmountRequired"})
  }

  if(!action) {
    return res.send({error: true, type: "actionRequired"})
  }

  if(!paymentReq) {
    return res.send({error: true, type: "paymentReqRequired"})
  }

  if(!phoneNumber) {
    return res.send({error: true, type: "phoneNumbeRequired"})
  }

  if(action !== 'BUY' && action !== 'SELL' && action !== 'BILLPAY') {
    return res.send({error: true, type: "invalidAction"})
  }

  if(action === 'BUY' && paymentReq.toLowerCase().indexOf('lnbc') !== 0) {
    return res.send({error: true, type: "invalidPaymentReqBuy"})
  }

  if(action === 'BUY' && !paymentIdentifier) {
    return res.send({error: true, type: "paymentIdentifierRequired"})
  }

  if(action === 'BUY') {
    const paymentIdentifierExists = await getPaymentIdentifier(db, paymentIdentifier)

    if(paymentIdentifierExists) {
      return res.send({error: true, type: "paymentIdentifierUsed"})
    }
  }

  if(action === 'BILLPAY' && (!billerCategory || !billerService || !billerActionType || !billerAccountNumber)) {
    return res.send({error: true, type: "invalidBillPaySettings"})
  }

  if((action === 'SELL' || action === 'BILLPAY') && (!invoice || !paymentHash || !timestamp)) {
    return res.send({error: true, type: "invalidInvoice"})
  }

  if(action === 'SELL') {
    const isValidIban = ibantools.isValidIBAN(ibantools.electronicFormatIBAN(paymentReq))
    const isValidSinpe = paymentReq.replace(/[^0-9]/gi, '').trim().length === 8

    if(!isValidIban && fiatCurrency === 'USD') {
      return res.send({error: true, type: "usdIbanRequired"})
    }

    if(!isValidIban && !isValidSinpe) {
      return res.send({error: true, type: "invalidPaymentReqSell"})
    }

    // if(isValidSinpe) {
    //   const phoneNumberCheck = await checkPhoneNumberForSinpe(paymentReq.replace(/[^0-9]/gi, '').trim())

    //   if(phoneNumberCheck.error) {
    //     return res.send({error: true, message: phoneNumberCheck.message})
    //   }
    // }
  }

  const priceData = await getPrice()

  if((satAmount / 100000000) * priceData['BTCCAD'] >= 995) {
    return res.send({error: true, type: "invalidFiatAmount"})
  }

  await addOrder(db, timestamp)

  if(action === 'SELL' || action === 'BILLPAY') {
    let invoicePaid
    for (var i = 0; i < 100; i++) {
      console.log('checking invoice', i, timestamp)

      invoicePaid = await checkInvoice(timestamp)

      if(invoicePaid) {
        console.log('invoice paid', timestamp)
        break
      } else {
        await new Promise(resolve => setTimeout(resolve, 2500))
      }
    }

    if(!invoicePaid) {
      await deleteOrder(db, timestamp)
      return res.send({error: true, type: "invoiceNotPaid"})
    }
  }

  const satAmountFormatted = Number(satAmount).toLocaleString()
  const fiatAmountFormatted = Number(fiatAmount).toLocaleString()

  let fromCurrency = null
  let fromAmount = null
  let toCurrency = null
  let toAmount = null
  let paymentType = null
  let paymentDestination = null
  let type = null
  let formulaFreeAmount = (satAmount / 100000000).toFixed(8)

  switch(action) {
    case 'BUY':
      fromCurrency = fiatCurrency
      fromAmount = fiatAmountFormatted

      toCurrency = 'BTC'
      toAmount = `=(${satAmount} / 100000000)`

      paymentType = 'SINPE'
      type = 'Buy'

      paymentDestination = paymentReq
      
      break;

    case 'SELL':
    case 'BILLPAY':
      fromCurrency = 'BTC'
      fromAmount = `=(${satAmount} / 100000000)`

      toCurrency = fiatCurrency
      toAmount = fiatAmountFormatted

      type = 'Sell'

      if(action === 'BILLPAY') {
        paymentType = 'Bill Payment'
      } else {
        paymentType = 'SINPE'
      }

      paymentDestination = paymentReq

      break;

    default:
      console.log('no buy nor sell uh-oh')
      break;
  }

  const rowData = { 
    "Date": timestamp,
    "Type": type,
    "From Amount": fromAmount,
    "From Currency": fromCurrency,
    "To Amount": toAmount,
    "To Currency": toCurrency,
    "Payment Type": paymentType,
    "Payment Identifier": paymentIdentifier,
    "Payment Destination": paymentDestination,
    "Biller Category": billerCategory,
    "Biller Service": billerService,
    "Biller Action Type": billerActionType,
    "Biller Account Number": billerAccountNumber,
    "Settlement LN Invoice": invoice,
    "Invoice Payment PreImage": paymentHash,
    "USD/CRC": priceData.USDCRC,
    "USD/CAD": priceData.USDCAD,
  }

  console.log('processed order data to', rowData)

  await updateOrderData(db, timestamp, rowData)

  try {
    const phoneUser = await getPhoneNumber(db, phoneNumber)

    if(!phoneUser) {
      console.log('adding new phoneUser')

      await addPhoneNumber(db, phoneNumber)
      const newUser = await getPhoneNumber(db, phoneNumber)

      googleSheetEventHandler.emit(
        'addRow', 
        {
          rowData: {
            "Date": timestamp,
            "Customer ID": newUser.id,
            "Phone Number": phoneNumber,
          },
          sheet: 1,
        }
      )

      rowData['User'] = newUser.id
    } else {
      console.log('found existing phoneUser')

      rowData['User'] = phoneUser.id
    }
  } catch(e) {
    console.log('error finding phoneUser', e)
  }

  if(action === "BUY") {
    await addPaymentIdentifier(db, paymentIdentifier)
  }

  await updateOrderData(db, timestamp, rowData)
  await updateOrderStatus(db, timestamp, 'complete')

  telegramEventHandler.emit(
    'sendMessage',
    {
      rowData,
      formulaFreeAmount,
      bolt11: (action === "BUY" ? paymentDestination : null),
      timestamp: (action === "SELL" ? timestamp : null),
    }
  )

  googleSheetEventHandler.emit(
    'addRow', 
    {
      rowData,
      sheet: 0,
    }
  )

  console.log('order submitted successfully.')

  return res.send({success: true})
})

app.post('/invoice', async (req, res) => {
  const apiKey = req.body.apiKey
  const label = req.body.label
  const description = req.body.description
  const satAmount = req.body.satAmount

  if(!apiKey) {
    return res.send({error: true, type: "apiKeyRequired"})
  }

  if(apiKey !== api_key) {
    return res.send({error: true, type: "apiKeyIncorrect"})
  }

  if(!label) {
    return res.send({error: true, message: "Label is required"})
  }

  if(!description) {
    return res.send({error: true, message: "Description is required."})
  }

  if(!satAmount) {
    return res.send({error: true, type: "satAmountRequired"})
  }

  const invoiceData = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1001).toString(),
    method: "createInvoice",
    params: {
      label: label,
      description: description,
      msatoshi: parseInt(satAmount * 1000),
    }
  }

  const response = await axios(invoice_endpoint_url, {
    method: "POST",
    auth: {
      username: invoice_endpoint_user,
      password: invoice_endpoint_password,
    },
    data: invoiceData,
  })

  return res.send(response.data)
})

app.get('/price', async (req, res) => {
  const priceData = await getPrice()
  return res.send(priceData)
})

app.get('/ticker', async (req, res) => {
  const tickerData = await getTicker()
  return res.send(tickerData)
})

app.get('/order', (req, res) => {
  let uri = '/'
  if(req.query.key) {
    uri = '/?key=' + req.query.key
  }
  res.redirect(uri)
})

app.get('/user', async (req, res) => {
  const apiKey = req.body.apiKey
  const bitcoinJungleUsername = req.query.bitcoinJungleUsername

  if(!apiKey) {
    return res.send({error: true, message: "apiKey is required"})
  }

  if(apiKey !== admin_api_key) {
    return res.send({error: true, message: "apiKey is incorrect"})
  }

  if(!bitcoinJungleUsername) {
    return res.send({error: true, message: "username is required"})
  }

  const user = await getUser(db, bitcoinJungleUsername)

  if(!user) {
    return res.send({error: true, message: "username doesn't exist"})
  }

  return res.send({success: true, data: user})
})

app.post('/addUser', async (req, res) => {
  const apiKey = req.body.apiKey
  const bitcoinJungleUsername = req.body.bitcoinJungleUsername

  if(!apiKey) {
    return res.send({error: true, message: "apiKey is required"})
  }

  if(apiKey !== api_key) {
    return res.send({error: true, message: "apiKey is incorrect"})
  }

  if(!bitcoinJungleUsername) {
    return res.send({error: true, message: "username is required"})
  }

  const userExists = await getUser(db, bitcoinJungleUsername)

  if(userExists) {
    if(userExists.approved) {
      return res.send({error: true, message: "username exists already"})
    }

    if(!userExists.approved) {
      return res.send({error: true, type: "pendingApproval"})
    }
  }

  const user = await addUser(db, bitcoinJungleUsername)
  const tgMsg = await sendUserAddMessage(bitcoinJungleUsername)
  
  if(!user) {
    return res.send({error: true, message: "error adding user"})
  }

  return res.send({success: true})
})

app.get('/approveUser', async (req, res) => {
  const apiKey = req.body.apiKey || req.query.apiKey
  const bitcoinJungleUsername = req.body.bitcoinJungleUsername || req.query.bitcoinJungleUsername

  if(req.headers['user-agent'].indexOf('TelegramBot') !== -1) {
    return res.send({error: true, message: "no bots"})
  }

  if(!apiKey) {
    return res.send({error: true, message: "apiKey is required"})
  }

  if(apiKey !== admin_api_key) {
    return res.send({error: true, message: "apiKey is incorrect"})
  }

  if(!bitcoinJungleUsername) {
    return res.send({error: true, message: "username is required"})
  }

  const user = await getUser(db, bitcoinJungleUsername)

  if(!user) {
    return res.send({error: true, message: "username does not exist"})
  }

  const update = await approveUser(db, bitcoinJungleUsername)

  if(!update) {
    return res.send({error: true, message: "error approving user"})
  }

  return res.send({success: true})
})

app.post('/deactivateUser', async (req, res) => {
  const apiKey = req.body.apiKey
  const bitcoinJungleUsername = req.body.bitcoinJungleUsername

  if(!apiKey) {
    return res.send({error: true, message: "apiKey is required"})
  }

  if(apiKey !== admin_api_key) {
    return res.send({error: true, message: "apiKey is incorrect"})
  }

  if(!bitcoinJungleUsername) {
    return res.send({error: true, message: "username is required"})
  }

  const user = await getUser(db, bitcoinJungleUsername)

  if(!user) {
    return res.send({error: true, message: "username does not exist"})
  }

  const update = await deactivateUser(db, bitcoinJungleUsername)

  if(!update) {
    return res.send({error: true, message: "error deactivating user"})
  }

  return res.send({success: true})
})

app.post('/addToSheet', async (req, res) => {
  const timestamp = req.body.timestamp

  if(!timestamp) {
    return res.send({error: true, message: "timestamp is required"})
  }

  const order = await getOrder(db, timestamp)

  if(!order) {
    return res.send({error: true, message: "order not found"})
  }

  const data = JSON.parse(order.data)

  const added = await addRowToSheet(data, 0)

  return res.send({success: true})
})

app.get('/checkPhoneNumberForSinpe', async (req, res) => {
  let phoneNumber = req.query.phoneNumber
  const apiKey = req.query.apiKey

  if(!apiKey) {
    return res.send({error: true, type: "apiKeyRequired"})
  }

  if(apiKey !== api_key) {
    return res.send({error: true, type: "apiKeyIncorrect"})
  }

  if(!phoneNumber) {
    return res.send({error: true, message: "phoneNumber is required"})
  }

  phoneNumber = phoneNumber.replace(/[^0-9]/gi, '').trim()

  if(phoneNumber.length !== 8) {
    return res.send({error: true, message: "phoneNumber must be 8 digits"})
  }

  const result = await checkPhoneNumberForSinpe(phoneNumber)

  return res.send(result)
})

app.get('/payInvoice', async (req, res) => {
  const apiKey = req.query.apiKey
  const bolt11 = req.query.bolt11

  if(!apiKey) {
    return res.send({error: true, message: "apiKey is required"})
  }

  if(apiKey !== admin_api_key) {
    return res.send({error: true, message: "apiKey is incorrect"})
  }

  if(!bolt11) {
    return res.send({error: true, message: "bolt11 is required"})
  }

  const payment = await payInvoice(bolt11)

  if(payment) {
    return res.send(payment)
  }

  return res.send({error: true, message: "Error sending payment"})
})

app.get('/payFiat', async (req, res) => {
  const apiKey = req.query.apiKey
  const timestamp = req.query.timestamp

  if(!apiKey) {
    return res.send({error: true, message: "apiKey is required"})
  }

  if(apiKey !== admin_api_key) {
    return res.send({error: true, message: "apiKey is incorrect"})
  }

  if(!timestamp) {
    return res.send({error: true, message: "timestamp is required"})
  }

  const order = await getOrder(db, timestamp)

  if(!order) {
    return res.send({error: true, message: "order not found"})
  }

  if(order.status !== 'complete') {
    return res.send({error: true, message: "order has not been processed internally yet"})
  }

  if(order.paymentStatus === 'in-flight') {
    return res.send({error: true, message: "order payment status is currently in-flight"})
  }

  if(order.paymentStatus === 'complete') {
    return res.send({error: true, message: "order payment status is already complete, can't send fiat twice."})
  }

  if(order.Type !== "Sell") {
    return res.send({error: true, message: "can only send fiat for 'Sell' orders"})
  }

  try {
    const orderData = JSON.parse(order.data)
  } catch (e) {
    console.log('error parsing order data json', e)
    return res.send({error: true, message: "error parsing order data json"})
  }

  const currency = orderData["To Currency"]
  const amount = parseFloat(orderData["To Amount"].replace(/,/g, ""))
  const destination = orderData["Payment Destination"]

  const isValidIban = ibantools.isValidIBAN(ibantools.electronicFormatIBAN(destination))
  const isValidSinpe = destination.replace(/[^0-9]/gi, '').trim().length === 8

  if(!isValidIban && !isValidSinpe) {
    return res.send({error: true, message: "Payment destination is not valid IBAN nor SINPE number"})
  }

  await updateOrderPaymentStatus(db, timestamp, 'in-flight')

  const ourAccount = await ridivi.getAccount({currency})

  if(!ourAccount) {
    await updateOrderPaymentStatus(db, timestamp, null)
    return res.send({error: true, message: "error with getAccount"})
  }

  if(ourAccount.data.error) {
    await updateOrderPaymentStatus(db, timestamp, null)
    return res.send({error: true, message: ourAccount.data.message})
  }

  if(ourAccount.data.account.Currency !== currency) {
    await updateOrderPaymentStatus(db, timestamp, null)
    return res.send({error: true, message: "Our account currency does not match order currency"})
  }

  if(ourAccount.data.account.Blocked || ourAccount.data.account.MasterBlocked) {
    await updateOrderPaymentStatus(db, timestamp, null)
    return res.send({error: true, message: "Our account has been blocked"})
  }

  if(!ourAccount.data.account.Active) {
    await updateOrderPaymentStatus(db, timestamp, null)
    return res.send({error: true, message: "Our account is not active"})
  }

  if(parseFloat(ourAccount.data.account.Balance) < amount) {
    await updateOrderPaymentStatus(db, timestamp, null)
    return res.send({error: true, message: "Our account balance is less than the order amount to send"})
  }

  if(isValidIban) {
    const theirAccount = await ridivi.getIbanData({destination})

    if(!theirAccount) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: "error with getIbanData"})
    }

    if(theirAccount.data.error) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: theirAccount.data.message})
    }

    if(theirAccount.data.account.CodigoMoneda !== currency) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: "Their account currency does not match order currency"})
    }

    const loadTransfer = await ridivi.loadTransfer({
      currency,
      toId: theirAccount.data.account.idNumber,
      toIban: destination,
      toName: theirAccount.data.account.NomPropietario,
      amount: amount,
      description: `pago por orden ${order.id}`,
      reference: timestamp,
    })

    if(!loadTransfer) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: "error with loadTransfer"})
    }

    if(loadTransfer.data.error) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: loadTransfer.data.message})
    }

    if(!loadTransfer.data.loadKey) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: "loadTransfer failed to generate loadKey"})
    }

    const sendLoadedTransfer = await ridivi.sendLoadedTransfer({
      loadKey: loadTransfer.data.loadKey,
    })

    if(!sendLoadedTransfer) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: "error with sendLoadedTransfer"})
    }

    if(sendLoadedTransfer.data.error) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: sendLoadedTransfer.data.message || sendLoadedTransfer.data.error})
    }

    await updateOrderPaymentStatus(db, timestamp, 'complete')

    return res.send({error: false, data: sendLoadedTransfer.data})

  } else if(isValidSinpe) {
    const phoneNumberCheck = await checkPhoneNumberForSinpe(destination.replace(/[^0-9]/gi, '').trim())

    if(phoneNumberCheck.error) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: phoneNumberCheck.message})
    }

    const loadTransferCh4 = await ridivi.loadTransferCh4({
      phoneNumber: destination,
      description: `pago por orden ${order.id}`,
      amount: amount,
    })

    if(!loadTransferCh4) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: "error with loadTransferCh4"})
    }

    if(loadTransferCh4.data.error) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: loadTransferCh4.data.message})
    }

    if(!loadTransferCh4.data.loadKey) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: "loadTransferCh4 failed to generate loadKey"})
    }

    const sendLoadTransferCh4 = await ridivi.sendLoadTransferCh4({
      loadKey: loadTransferCh4.data.loadKey,
    })

    if(!sendLoadTransferCh4) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: "error with sendLoadTransferCh4"})
    }

    if(sendLoadTransferCh4.data.error) {
      await updateOrderPaymentStatus(db, timestamp, null)
      return res.send({error: true, message: sendLoadTransferCh4.data.message})
    }

    await updateOrderPaymentStatus(db, timestamp, 'complete')

    return res.send({error: false, data: sendLoadTransferCh4.data})
  }

  await updateOrderPaymentStatus(db, timestamp, null)
  return res.send({error: true, message: "Payment destination is not valid IBAN nor SINPE number"})
})

const payInvoice = async (bolt11) => {
  try {
    const proxyPort = (process.env.NODE_ENV !== "production" ? 9150 : 9050)
    const httpsAgent = new SocksProxyAgent(`socks://127.0.0.1:${proxyPort}`, {rejectUnauthorized: false})

    const response = await axios(sparkwallet_url, {
      method: "POST",
      auth: {
        username: sparkwallet_user,
        password: sparkwallet_password,
      },
      data: {
        method: "_pay",
        params: [
          bolt11,
          null,
        ],
      },
      rejectUnauthorized: false,
      httpsAgent,
    })

    if(response.data.status === "complete") {
      return response.data
    }

    return false

  } catch (e) {
    console.log('error paying invoice', e)
    return false
  }
}

const checkPhoneNumberForSinpe = async (phoneNumber) => {
  const response = await ridivi.getInfoNumCh4({ phoneNumber })

  if(!response) {
    return {
      error: true,
      message: "An unexpected error has occurred.",
    }
  }

  if(response.data.error) {
    return {
      error: true,
      message: response.data.error.message || "An unexpected error has occurred.",
    }
  }

  if(response.data.result.error) {
    return {
      error: true,
      message: response.data.result.message || "An unexpected error has occurred.",
    }
  }

  return { 
    error: false,
    data: response.data.result.result,
  }
}

const sendOrderToTelegram = async (rowData, formulaFreeAmount, bolt11, timestamp) => {
  try {
    let message = `🚨 New Order 🚨\n`

    Object.keys(rowData).forEach(key => {
      let val = rowData[key]

      if(val && val.toString().length) {
        if(val[0] === '=') {
          val = formulaFreeAmount
        }

        message += `${key}: ${val}\n`
      }
    })

    const optionsObj = {}

    if(bolt11) {
      optionsObj.reply_markup = {
        inline_keyboard: [
          [
            {
              text: "Pay Lightning Invoice",
              url: `https://orders.bitcoinjungle.app/payInvoice?apiKey=${admin_api_key}&bolt11=${bolt11}`
            }
          ],
        ],
      }
    }

    if(timestamp) {
      optionsObj.reply_markup = {
        inline_keyboard: [
          [
            {
              text: "Pay Out Fiat",
              url: `https://orders.bitcoinjungle.app/payFiat?apiKey=${admin_api_key}&timestamp=${timestamp}`
            }
          ],
        ],
      }
    }

    const resp = await bot.telegram.sendMessage(
      chat_id, 
      message,
      optionsObj
    )

    return resp
  } catch(e) {
    console.log('telegram error', e)

    return false
  }
}

const addRowToSheet = async (rowData, sheetIndex) => {
  try {
    const sheet = doc.sheetsByIndex[sheetIndex]

    await new Promise(resolve => setTimeout(resolve, (Math.floor(Math.random() * 6) + 1) * 1000))

    const newRow = await sheet.addRow(rowData, {insert: true})

    console.log('row added to sheet ' + sheetIndex)

    return true
  } catch(e) {
    console.log('gsheet error adding to sheet ' + sheetIndex, e)

    return false
  }
}

const sendUserAddMessage = async (bitcoinJungleUsername) => {
  try {
    let message = `New User Requesting Access: ${bitcoinJungleUsername}\n`
    message += `Click [here](https://orders.bitcoinjungle.app/approveUser?bitcoinJungleUsername=${bitcoinJungleUsername}&apiKey=${admin_api_key}) to approve this new user`

    const resp = await bot.telegram.sendMessage(chat_id, message, {parse_mode: 'MarkdownV2'})

    return resp
  } catch(e) {
    console.log('telegram error', e)

    return false
  }
}

const checkInvoice = async (label) => {
  const invoiceData = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1001).toString(),
    method: "getInvoice",
    params: {
      label: label,
    }
  }

  try {
    const response = await axios(invoice_endpoint_url, {
      method: "POST",
      auth: {
        username: invoice_endpoint_user,
        password: invoice_endpoint_password,
      },
      data: invoiceData,
    })

    if(response.data.result.status === 'paid') {
      return true
    }

    return false
    
  } catch(e) {
    console.log('error checking invoice', e)
    return false
  }
}

const getBullPrice = async (from, to) => {
  try {
    const response = await axios({
      method: "POST",
      url: price_data_url,
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        "id": Math.floor(Math.random() * 1001).toString(),
        "jsonrpc": "2.0",
        "method": "getRate",
        "params": {
          "to": to,
          "from": from
        }
      }
    })

    return response
  } catch(e) {
    console.log('error getBullPrice', from, to)
    await new Promise(resolve => setTimeout(resolve, 5000))
    return await getBullPrice(from, to)
  }
}

const getUsdCrc = async () => {
  try {
    const crcFiatResponse = await axios.get(`https://api.exchangeratesapi.io/v1/latest?access_key=${exchange_rate_api_key}&base=USD&symbols=CRC`)

    if(!crcFiatResponse || !crcFiatResponse.data || !crcFiatResponse.data.success || !crcFiatResponse.data.rates || !crcFiatResponse.data.rates || !crcFiatResponse.data.rates.CRC) {
     return {error: true, message: "Error fetching price"}
    }

    USDCRC = {indexPrice: crcFiatResponse.data.rates.CRC}

    console.log('set USDCRC to ', USDCRC)
  } catch(e) {
    console.log('error setting USDCRC', e)
    setTimeout(getUsdCrc, 5000)
  }

  return USDCRC
}

// const getUsdCrc = async () => {
//   const response = await getBullPrice("USD", "CRC")

//   USDCRC = response.data.result

//   console.log('set USDCRC to', USDCRC)

//   return USDCRC
// }

setInterval(getUsdCrc, 60 * 1000 * 240)

getUsdCrc()

const getUsdCad = async () => {
  try {
    const cadFiatResponse = await axios.get(`https://api.exchangeratesapi.io/v1/latest?access_key=${exchange_rate_api_key}&base=USD&symbols=CAD`)

    if(!cadFiatResponse || !cadFiatResponse.data || !cadFiatResponse.data.success || !cadFiatResponse.data.rates || !cadFiatResponse.data.rates || !cadFiatResponse.data.rates.CAD) {
     return {error: true, message: "Error fetching price"}
    }

    USDCAD = cadFiatResponse.data.rates.CAD

    console.log('set USDCAD to ', USDCAD)
  } catch(e) {
    console.log('error setting USDCAD', e)
    setTimeout(getUsdCad, 5000)
  }
  
  return USDCAD
}

setInterval(getUsdCad, 60 * 1000 * 240)

getUsdCad()

const getBtcCrc = async () => {
  const response = await getBullPrice("BTC", "CRC")

  BTCCRC = response.data.result

  console.log('set BTCCRC to', BTCCRC)

  return BTCCRC
}

setInterval(getBtcCrc, 60 * 1000)

getBtcCrc()

const getBtcUsd = async () => {
  const response = await getBullPrice("BTC", "USD")

  BTCUSD = response.data.result

  console.log('set BTCUSD to', BTCUSD)

  return BTCUSD
}

setInterval(getBtcUsd, 60 * 1000)

getBtcUsd()

const getBtcCad = async () => {
  const response = await getBullPrice("BTC", "CAD")

  BTCCAD = response.data.result

  console.log('set BTCCAD to', BTCCAD)

  return BTCCAD
}

setInterval(getBtcCad, 60 * 1000)

getBtcCad()

const getPrice = async () => {
  try {
    const response = await axios({
      method: "POST",
      url: "https://api.mainnet.bitcoinjungle.app/graphql",
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        query: "query BtcPriceList($range: PriceGraphRange!) {\n  btcPriceList(range: $range) {\n    price {\n      base\n      currencyUnit\n      formattedAmount\n      offset\n    }\n    timestamp\n  }\n}",
        variables: {
          range: "ONE_DAY"
        },
        operationName: "BtcPriceList"
      }
    })

    if(!response || !response.data || !response.data.data || !response.data.data.btcPriceList || !response.data.data.btcPriceList.length) {
      return {error: true, message: "Error fetching price"}
    }

    const priceData = response.data.data.btcPriceList.sort((a,b) => a.timestamp - b.timestamp).reverse()[0]
    const timestamp = new Date(priceData.timestamp * 1000).toISOString()

    const BTCCRC = Math.round(((priceData.price.base / 10 ** priceData.price.offset) / 100))

    const BTCUSD = Number(BTCCRC / USDCRC.indexPrice).toFixed(2)

    const BTCCAD = Number(BTCUSD * USDCAD).toFixed(2)

    return {BTCCRC, USDCRC: USDCRC.indexPrice, USDCAD, BTCUSD, BTCCAD, timestamp}
  } catch(e) {
    return {error: true, message: "Error fetching price"}
  }
}

const getTicker = async () => {
  const timestamp = new Date().toISOString()

  return {
    BTCCRC,
    USDCRC,
    USDCAD,
    BTCUSD,
    BTCCAD,
    timestamp,
  }
}

const getUser = async (db, bitcoinJungleUsername) => {
  try {
    return await db.get(
      "SELECT * FROM users WHERE bitcoinJungleUsername = ?", 
      [bitcoinJungleUsername]
    )
  } catch {
    return false
  }
}

const addUser = async (db, bitcoinJungleUsername) => {
  const timestamp = Math.floor(Date.now() / 1000)
  try {
    return await db.run(
      "INSERT INTO users (bitcoinJungleUsername, approved, timestamp) VALUES (?, ?, ?)", 
      [bitcoinJungleUsername, false, timestamp]
    )
  } catch(e) {
    console.log(e)
    return false
  }
}

const approveUser = async (db, bitcoinJungleUsername) => {
  const timestamp = Math.floor(Date.now() / 1000)
  try {
    return await db.run(
      "UPDATE users SET approved = true WHERE bitcoinJungleUsername = ?", 
      [bitcoinJungleUsername]
    )
  } catch {
    return false
  }
}

const deactivateUser = async (db, bitcoinJungleUsername) => {
  try {
    return await db.run(
      "UPDATE users SET approved = false WHERE bitcoinJungleUsername = ?", 
      [bitcoinJungleUsername]
    )
  } catch {
    return false
  }
}

const addPaymentIdentifier = async (db, identifier) => {
  try {
    return await db.run(
      "INSERT INTO payment_identifiers (identifier) VALUES (?)", 
      [identifier]
    )
  } catch(e) {
    console.log(e)
    return false
  }
}

const getPaymentIdentifier = async (db, identifier) => {
  try {
    return await db.get(
      "SELECT * FROM payment_identifiers WHERE identifier = ?", 
      [identifier]
    )
  } catch {
    return false
  }
}

const getPhoneNumber = async (db, phoneNumber) => {
  try {
    return await db.get(
      "SELECT * FROM phone_numbers WHERE phoneNumber = ?", 
      [phoneNumber]
    )
  } catch {
    return false
  }
}

const addPhoneNumber = async (db, phoneNumber) => {
  try {
    return await db.run(
      "INSERT INTO phone_numbers (phoneNumber) VALUES (?)", 
      [phoneNumber]
    )
  } catch {
    return false
  }
}

const addOrder = async (db, timestamp) => {
  try {
    return await db.run(
      "INSERT INTO orders (timestamp, status, data) VALUES (?, ?, ?)",
      [
        timestamp,
        "in-flight",
        JSON.stringify({})
      ]
    )
  } catch(e) {
    console.log('addOrder error', e)
    return false
  }
}

const getOrder = async (db, timestamp) => {
  try {
    return await db.get(
      "SELECT * FROM orders WHERE timestamp = ?", 
      [timestamp]
    )
  }catch(e) {
    console.log('getOrder error', e)
    return false
  }
}

const updateOrderStatus = async (db, timestamp, status) => {
  try {
    return await db.run(
      "UPDATE orders SET status = ? WHERE timestamp = ?",
      [
        status,
        timestamp,
      ]
    )
  } catch(e) {
    console.log('updateOrderStatus error', e)
    return false
  }
}

const updateOrderPaymentStatus = async (db, timestamp, paymentStatus) => {
  try {
    return await db.run(
      "UPDATE orders SET paymentStatus = ? WHERE timestamp = ?",
      [
        paymentStatus,
        timestamp,
      ]
    )
  } catch(e) {
    console.log('updateOrderPaymentStatus error', e)
    return false
  }
}

const updateOrderData = async (db, timestamp, data) => {
  try {
    return await db.run(
      "UPDATE orders SET data = ? WHERE timestamp = ?",
      [
        JSON.stringify(data),
        timestamp,
      ]
    )
  } catch(e) {
    console.log('updateOrderData error', e)
    return false
  }
}

const deleteOrder = async (db, timestamp) => {
  try {
    return await db.run(
      "DELETE FROM orders WHERE timestamp = ?",
      [
        timestamp,
      ]
    )
  } catch(e) {
    console.log('deleteOrder error', e)
    return false
  }
}

const server = app.listen(port, () => console.log("Listening on port", port))
server.setTimeout(1000 * 60 * 9)