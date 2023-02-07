import express from "express"
import { Telegraf } from "telegraf"
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import bodyParser from 'body-parser'
import * as dotenv from 'dotenv'

dotenv.config()

const telegram_bot_token = process.env.telegram_bot_token
const port = process.env.port
const chat_id = process.env.chat_id
const db_location = process.env.db_location
const base_path = process.env.base_path
const api_key = process.env.api_key

const bot = new Telegraf(telegram_bot_token)
const app = express()

const db = await open({
  filename: db_location,
  driver: sqlite3.Database
})

app.use(bodyParser.json())

app.post('/order', async (req, res) => {
  const apiKey = req.body.apiKey
  const fiatAmount = parseFloat(req.body.fiatAmount.replace(/,/g, ""))
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

  const order = await db.run(
    "INSERT INTO orders (fiat_amount, fiat_currency, sat_amount, direction, payment_request) VALUES (?, ?, ?, ?, ?)", 
    [
      parseInt(fiatAmount * 100),
      fiatCurrency,
      satAmount,
      direction,
      paymentReq,
      ]
    )

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