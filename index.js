import express from "express"
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

const bot = new Telegraf(telegram_bot_token)
const app = express()

const doc = new GoogleSpreadsheet(google_sheet_id);

app.use(bodyParser.json())
app.use(serveStatic('front_end/build', { 'index': ['index.html'] }))

app.post('/order', async (req, res) => {
  const apiKey = req.body.apiKey
  const fiatAmount = (req.body.fiatAmount ? parseFloat(req.body.fiatAmount.replace(/,/g, "")) : null)
  const fiatCurrency = (req.body.fiatCurrency ? req.body.fiatCurrency.toUpperCase() : null)
  const satAmount  = (req.body.satAmount ? parseInt(req.body.satAmount.replace(/,/g, "").replace(/\./g, "")) : null)
  const action  = (req.body.action ? req.body.action.toUpperCase() : null)
  let paymentReq = (req.body.paymentReq ? req.body.paymentReq : null)

  const randomWords = (req.body.randomWords && req.body.action === "BUY" ? req.body.randomWords : "")
  
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

  if(action === 'BUY' && randomWords.split(' ').length !== 3) {
    return res.send({error: true, message: "There must be 3 random words as a payment identifier when BUY action is set"})
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

  const priceData = await getPrice()

  await doc.useServiceAccountAuth({
    client_email: service_account_email,
    private_key: service_account_json.private_key,
  })

  await doc.loadInfo()

  const sheet = doc.sheetsByIndex[0]

  const rowData = { 
    "Date": new Date().toISOString(),
    "Type": type,
    "From Amount": fromAmount,
    "From Currency": fromCurrency,
    "To Amount": toAmount,
    "To Currency": toCurrency,
    "Payment Type": paymentType,
    "Payment Destination": paymentDestination,
    "Biller Category": billerCategory,
    "Biller Service": billerService,
    "Biller Action Type": billerActionType,
    "Biller Account Number": billerAccountNumber,
    "USD/CRC": priceData.USDCRC,
    "USD/CAD": priceData.USDCAD,
  }

  if(randomWords) {
    rowData["Payment Identifier"] = randomWords
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

app.get('/price', async (req, res) => {
  const priceData = await getPrice()
  return res.send(priceData)
})

app.get('/order', (req, res) => {
  let uri = '/'
  if(req.query.key) {
    uri = '/?key=' + req.query.key
  }
  res.redirect(uri)
})

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

  const fiatResponse = await axios.get(`https://api.exchangeratesapi.io/v1/latest?access_key=${exchange_rate_api_key}&base=USD&symbols=CRC`)

  if(!fiatResponse || !fiatResponse.data || !fiatResponse.data.success || !fiatResponse.data.rates || !fiatResponse.data.rates || !fiatResponse.data.rates.CRC) {
    return {error: true, message: "Error fetching price"}
  }

  const USDCRC = fiatResponse.data.rates.CRC

  const BTCUSD = Number(BTCCRC / USDCRC).toFixed(2)

  const cadFiatResponse = await axios.get(`https://api.exchangeratesapi.io/v1/latest?access_key=${exchange_rate_api_key}&base=USD&symbols=CAD`)

  if(!cadFiatResponse || !cadFiatResponse.data || !cadFiatResponse.data.success || !cadFiatResponse.data.rates || !cadFiatResponse.data.rates || !cadFiatResponse.data.rates.CAD) {
   return {error: true, message: "Error fetching price"}
  }

  const USDCAD = cadFiatResponse.data.rates.CAD

  return {BTCCRC, USDCRC, USDCAD, BTCUSD, timestamp}
}

app.listen(port, () => console.log("Listening on port", port))