import * as dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const ridivi_endpoint_url = process.env.ridivi_endpoint_url
const ridivi_endpoint_user = process.env.ridivi_endpoint_user
const ridivi_endpoint_password = process.env.ridivi_endpoint_password
const ridivi_id = process.env.ridivi_id
const ridivi_crc_account = process.env.ridivi_crc_account
const ridivi_usd_account = process.env.ridivi_usd_account
const ridivi_name = process.env.ridivi_name

const callApi = async (obj) => {
  try {
    const postData = {
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1001).toString(),
      method: "ridivi",
      params: obj,
    }

    console.log('callApi', postData)

    const response = await axios(ridivi_endpoint_url, {
      method: "POST",
      auth: {
        username: ridivi_endpoint_user,
        password: ridivi_endpoint_password,
      },
      data: postData,
    })

    console.log(response.status, response.data)

    if(response.data && response.data.result) {
      return {
        data: response.data.result
      }
    }

    return false
  } catch (e) {
    console.log('error calling API', e)
    return false
  }
}

const getAccount = async ({ currency }) => {
  const iban = currency === 'CRC' ? ridivi_crc_account : ridivi_usd_account

  return await callApi({
    option: "getAccount",
    iban,
  })
}

const getIbanData = async ({ iban }) => {
  return await callApi({
    option: "getIbanData",
    iban,
  })
}

const loadTransfer = async ({ currency, toId, toIban, toName, amount, description, reference }) => {
  const ridiviAccount = {
    id: ridivi_id,
    iban: currency === 'CRC' ? ridivi_crc_account : ridivi_usd_account,
    name: ridivi_name,
  }

  return await callApi({
    option: "loadTransfer",
    time: "TFT",
    cur: currency,
    from: ridiviAccount,
    to: {
      id: toId,
      iban: toIban,
      name: toName,
    },
    fee: ridiviAccount,
    amount: amount,
    text: description,
    service: "",
    reference: reference,
  })
}

const sendLoadedTransfer = async ({ loadKey }) => {
  return await callApi({
    option: "sendLoadedTransfer",
    loadKey,
  })
}

const getLoadedTransfer = async ({ loadKey }) => {
  return await callApi({
    option: "getLoadedTransfer",
    loadKey,
  })
}

const getInfoNumCh4 = async ({ phoneNumber }) => {
  return await callApi({
    option: "getInfoNumCh4",
    NumTelefono: parseInt(phoneNumber),
  })
}

const loadTransferCh4 = async ({ phoneNumber, description, amount }) => {
  return await callApi({
    option: "loadTransferCh4",
    IbanOrigen: ridivi_crc_account,
    NumTelefonoDestino: parseInt(phoneNumber),
    Descripcion: description,
    Moneda: "1",
    Monto: amount,
  })
}

const sendLoadTransferCh4 = async ({ loadKey }) => {
  return await callApi({
    option: "sendLoadTransferCh4",
    loadKey,
  })
}

const getLoadTransferCh4 = async ({ loadKey }) => {
  return await callApi({
    option: "getLoadTransferCh4",
    loadKey,
  })
}

export { 
  getAccount, 
  getIbanData, 
  loadTransfer, 
  sendLoadedTransfer, 
  getLoadedTransfer, 
  getInfoNumCh4, 
  loadTransferCh4, 
  sendLoadTransferCh4, 
  getLoadTransferCh4,
}