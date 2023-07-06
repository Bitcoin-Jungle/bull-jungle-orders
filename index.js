import express from "express"
import compression from 'compression'
import { Telegraf } from "telegraf"
import bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import axios from 'axios'
import serveStatic from 'serve-static'

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

const bot = new Telegraf(telegram_bot_token)
const app = express()

const doc = new GoogleSpreadsheet(google_sheet_id);

const ordersInFlight = {}

let BTCCRC, USDCRC, USDCAD, BTCUSD, BTCCAD

app.use(bodyParser.json())
app.use(compression())
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

  if(ordersInFlight[timestamp]) {
    if(ordersInFlight[timestamp].status === 'complete') {
      return res.send({success: true})
    } else if(ordersInFlight[timestamp].status === 'in-flight') {
      return res.send({inFlight: true})
    }
  }

  console.log('order received', req.body)

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

  if(!phoneNumber) {
    return res.send({error: true, message: "phoneNumber is required"})
  }

  if(action !== 'BUY' && action !== 'SELL' && action !== 'BILLPAY') {
    return res.send({error: true, message: "action should be buy or sell or billpay"})
  }

  if(action === 'BUY' && paymentReq.toLowerCase().indexOf('lnbc') !== 0) {
    return res.send({error: true, message: "paymentReq must start with lnbc when buying"})
  }

  if(action === 'BUY' && !paymentIdentifier) {
    return res.send({error: true, message: "Payment Identifier is required when BUY action is set"})
  }

  if(action === 'BILLPAY' && (!billerCategory || !billerService || !billerActionType || !billerAccountNumber)) {
    return res.send({error: true, message: "When action is BILLPAY, you must provide billerCategory, billerService, billerActionType, billerAccountNumber"})
  }

  if((action === 'SELL' || action === 'BILLPAY') && (!invoice || !paymentHash || !timestamp)) {
    return res.send({error: true, message: "When action is SELL or BILLPAY, you must provide an invoice and payment hash and timestamp."})
  }

  const priceData = await getPrice()

  if((satAmount / 100000000) * priceData['BTCCAD'] >= 995) {
    return res.send({error: true, message: "There is a per transaction limit of $1000 CAD"})
  }

  ordersInFlight[timestamp] = {
    status: 'in-flight',
  }

  if(action === 'SELL' || action === 'BILLPAY') {
    let invoicePaid
    for (var i = 0; i < 100; i++) {
      console.log('checking invoice', i, timestamp)
      await new Promise(resolve => setTimeout(resolve, 2500))

      invoicePaid = await checkInvoice(timestamp)

      if(invoicePaid) {
        console.log('invoice paid', timestamp)
        break
      }
    }

    if(!invoicePaid) {
      delete ordersInFlight[timestamp]
      return res.send({error: true, message: "Invoice has not been paid. Please try your order again."})
    }
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

  try {
    await doc.useServiceAccountAuth({
      client_email: service_account_email,
      private_key: service_account_json.private_key,
    })

    await doc.loadInfo()

    try {
      const userSheet = doc.sheetsByIndex[1]

      const users = await userSheet.getRows()
      const user = users.find((el) => el['Phone Number'] === phoneNumber)
      const lastUserId = (users.length ? users[users.length - 1]['Customer ID'] : 0)
      const newUserId = parseInt(lastUserId) + 1

      if(!user) {
        const newUserRow = await userSheet.addRow({
          "Date": timestamp,
          "Customer ID": newUserId,
          "Phone Number": phoneNumber,
        })

        rowData['User'] = newUserId
      } else {
        rowData['User'] = user['Customer ID']
      }
    } catch(e) {
      console.log('gsheet error adding user', e)
    }

    try {
      const sheet = doc.sheetsByIndex[0]

      const newRow = await sheet.addRow(rowData)
    } catch(e) {
      console.log('gsheet error adding order', e)
    }

  } catch (e) {
    console.log('gsheet error', e)
  }

  const telegramMessage = await sendOrderToTelegram(rowData, formulaFreeAmount)

  if(!telegramMessage) {
    await sendOrderToTelegram(rowData, formulaFreeAmount)
  }

  console.log('order submitted successfully.')

  ordersInFlight[timestamp].status = 'complete'

  return res.send({success: true})
})

app.post('/invoice', async (req, res) => {
  const apiKey = req.body.apiKey
  const label = req.body.label
  const description = req.body.description
  const satAmount = req.body.satAmount

  if(!apiKey) {
    return res.send({error: true, message: "apiKey is required"})
  }

  if(apiKey !== api_key) {
    return res.send({error: true, message: "apiKey is incorrect"})
  }

  if(!label) {
    return res.send({error: true, message: "Label is required"})
  }

  if(!description) {
    return res.send({error: true, message: "Description is required."})
  }

  if(!satAmount) {
    return res.send({error: true, message: "satAmount is required"})
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

app.get('/setCustomerIds', async (req, res) => {
  const timestamp = (req.query.timestamp ? req.query.timestamp : new Date().toISOString())

  try {
    await doc.useServiceAccountAuth({
      client_email: service_account_email,
      private_key: service_account_json.private_key,
    })

    await doc.loadInfo()
    try {
      const txnsSheet = doc.sheetsByIndex[0]
      const userSheet = doc.sheetsByIndex[1]

      const txns = await txnsSheet.getRows()
      const users = await userSheet.getRows()
      let txn, phoneNumber, lastUserId

      lastUserId = (users.length ? users[users.length - 1]['Customer ID'] : 1)

      console.log('lastUserId', lastUserId)

      for (var i = 0; i <= txns.length - 1; i++) {
        txn = txns[i]

        console.log('txn', txn['Date'])

        switch(txn['Type']) {
          case 'Sell':
            phoneNumber = txn['Payment Destination'].replace(/[^0-9]/g, '').trim()
            break;

          default:
            console.log('skip!', txn['Type'])
            phoneNumber = null
            break;
        }

        if(phoneNumber && phoneNumber.length) {
          console.log('phone number', phoneNumber)

          await new Promise(resolve => setTimeout(resolve, 500))

          const userExists = users.find((el) => el['Phone Number'].replace(/[^0-9]/g, '').trim() === phoneNumber)

          if(!userExists) {   
            lastUserId = lastUserId++   

            console.log('user doesnt exist, creating', lastUserId)

            const newUserRow = await userSheet.addRow({
              "Date": txn['Date'],
              "Customer ID": lastUserId,
              "Phone Number": phoneNumber,
            })

            users.push(newUserRow)

            await new Promise(resolve => setTimeout(resolve, 1000))

            txn['User'] = lastUserId++

            await txn.save()

            await new Promise(resolve => setTimeout(resolve, 1000))
          } else {
            console.log('user already exists', userExists['Customer ID'])

            txn['User'] = userExists['Customer ID']

            await txn.save()

            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }
    } catch(e) {
      console.log('gsheet error adding order', e)
    }
  } catch (e) {
    console.log('gsheet error', e)
  }
})

const sendOrderToTelegram = async (rowData, formulaFreeAmount) => {
  try {
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
  return await axios({
    method: "POST",
    url: price_data_url,
    headers: {
      "Content-Type": "application/json"
    },
    data: {
      "id": new Date().toISOString(),
      "jsonrpc": "2.0",
      "method": "getRate",
      "params": {
        "to": to,
        "from": from
      }
    }
  })
}

const getUsdCrc = async () => {
  const response = await getBullPrice("USD", "CRC")

  USDCRC = response.data.result

  console.log('set USDCRC to', USDCRC)

  return USDCRC
}

setInterval(getUsdCrc, 60 * 1000 * 240)

getUsdCrc()

const getUsdCad = async () => {
  const cadFiatResponse = await axios.get(`https://api.exchangeratesapi.io/v1/latest?access_key=${exchange_rate_api_key}&base=USD&symbols=CAD`)

  if(!cadFiatResponse || !cadFiatResponse.data || !cadFiatResponse.data.success || !cadFiatResponse.data.rates || !cadFiatResponse.data.rates || !cadFiatResponse.data.rates.CAD) {
   return {error: true, message: "Error fetching price"}
  }

  USDCAD = cadFiatResponse.data.rates.CAD

  console.log('set USDCAD to ', USDCAD)

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

app.listen(port, () => console.log("Listening on port", port))