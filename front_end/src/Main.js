import { useState, useEffect, useRef } from 'react'

import { localizeText, localize } from './lang/index'
import { getApiKey, getPhoneNumber, getUsername, getLanguage, getSatBalance, isFromBJ, isInIframe } from './utils/index'

import { SendReceiveIcon } from './components/SendReceiveIcon'
import Modal from './components/Modal'
import Invoice from './components/Invoice'
import Register from './Register'
import Chart from './Chart'
import Rules from './Rules'

import { 
  RECIPIENT_WALLET_ID, 
  LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT,
} from './utils/graphql'

const ibantools = require("ibantools")

function Main({ client, registeredUser }) {
  const submitOrderRef = useRef()
  const toggleLoadingOnRef = useRef()
  const toggleLoadingOffRef = useRef()
  const invoiceCreatedRef = useRef()

  const [language, setLanguage] = useState(getLanguage())

  const [loading, setLoading] = useState(false)
  const [disableButton, setDisableButton] = useState(false)

  const [priceData, setPriceData] = useState({})

  const [apiKey, setApiKey] = useState(getApiKey())
  const [fiatAmount, setFiatAmount] = useState("")
  const [fiatCurrency, setFiatCurrency] = useState("CRC")
  const [satAmount, setSatAmount] = useState("")
  const [action, setAction] = useState("")
  const [paymentReq, setPaymentReq] = useState("")
  const [paymentDesc, setPaymentDesc] = useState("")
  const [billerCategory, setBillerCategory] = useState("")
  const [billerService, setBillerService] = useState("")
  const [billerActionType, setBillerActionType] = useState("")
  const [billerAccountNumber, setBillerAccountNumber] = useState("")
  const [invoice, setInvoice] = useState("")
  const [paymentHash, setPaymentHash] = useState("")
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showChartModal, setShowChartModal] = useState(false)
  const [paymentIdentifier, setPaymentIdentifier] = useState("")
  const [timestamp, setTimestamp] = useState(new Date().toISOString())
  const [phoneNumber, setPhoneNumber] = useState(getPhoneNumber())
  const [username, setUsername] = useState(getUsername())
  const [overPerTxnLimit, setOverPerTxnLimit] = useState(false)
  const [underPerTxnMinimum, setUnderPerTxnMinimum] = useState(false)
  const [sinpeCheckData, setSinpeCheckData] = useState({})
  const [systemAlert, setSystemAlert] = useState({})

  const localized = localizeText(language)

  const getAlert = async () => {
    fetch("/alert")
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        console.log('error getting alert')
        return
      }

      setSystemAlert(data.data)
    })
    .catch((e) => {
      console.log('error getting alert', e)
    })
  }

  const handleAction = (action) => {
    clearForm()
    setAction(action)
    setDisableButton(true)
  }

  const fetchInvoice = () => {
    if(!fiatAmount) {
      alert(localized.errors.fiatAmountRequired)
      return false
    }

    if(!fiatCurrency) {
      alert(localized.errors.fiatCurrencyRequired)
      return false
    }

    if(!satAmount) {
      alert(localized.errors.satAmountRequired)
      return false
    }

    if(!action) {
      alert(localized.errors.actionRequired)
      return false
    }

    if(!paymentReq) {
      alert(localized.errors.paymentReqRequired)
      return false
    }

    if(action === 'BILLPAY' && (!billerCategory || !billerService || !billerActionType || !billerAccountNumber)) {
      alert(localized.errors.invalidBillPaySettings)
      return false
    }

    if(overPerTxnLimit) {
      alert(localized.overPerTxnLimit)
      return false
    }

    if(underPerTxnMinimum) {
      alert(localized.underPerTxnMinimum)
      return false
    }

    if(action === 'SELL') {
      const isValidIban = ibantools.isValidIBAN(ibantools.electronicFormatIBAN(paymentReq))
      const isValidSinpe = paymentReq.replace(/[^0-9]/gi, '').trim().length === 8

      if(!isValidIban && fiatCurrency === 'USD') {
        alert(localized.errors.usdIbanRequired)
        return false
      }

      if(!isValidIban && !isValidSinpe) {
       alert(localized.errors.invalidPaymentReqSell)
       return false
      }
    }

    setLoading(true)
    
    fetch("/invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        apiKey,
        label: timestamp,
        description: `${fiatAmount} ${fiatCurrency} to ${paymentReq} ${paymentDesc ? paymentDesc : ""}`,
        satAmount,
        action,
        fiatAmount,
        fiatCurrency,
        phoneNumber,
        paymentReq,
      })
    })
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        if(data.type) {
          alert(localize(localized.errors, data.type, data.data))
          return
        }

        if(data.message) {
          alert(data.message)
          return
        }

        alert(data.error.message || "An unexpected error has occurred")
        return
      } else {
        setInvoice(data.result.bolt11)
        setPaymentHash(data.result.payment_hash)
        setShowInvoiceModal(true)
      }
    })
    .catch((err) => {
      alert(err)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  const generateUserInvoice = async () => {
    setLoading(true)

    try {
      const response = await client.query({
        query: RECIPIENT_WALLET_ID,
        variables: {
          username,
        },
      })

      const response2 = await client.mutate({
        mutation: LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT,
        variables: {
          walletId: response.data.recipientWalletId,
          amount: satAmount,
        }
      })

      setPaymentReq(response2.data.mutationData.invoice.paymentRequest)
      setLoading(false)
    } catch(err) {
      alert(err.toString())
      setLoading(false)
      setPaymentReq("")
    }
  }

  const getPriceData = () => {
    fetch("/ticker")
    .then((res) => res.json())
    .then((data) => {
      if(data.timestamp) {
        data.timestamp = new Date(data.timestamp).toLocaleString()
      }

      setPriceData(data)
    })
    .catch((err) => {
      // alert(err)
      setPriceData({error: true, message: err.toString()})
    })
  }

  const clearForm = () => {
    setFiatAmount("")
    setFiatCurrency("CRC")
    setSatAmount("")
    setAction("")
    setPaymentReq("")
    setPaymentDesc("")
    setPhoneNumber(getPhoneNumber())
    setUsername(getUsername())
    setBillerCategory("")
    setBillerService("")
    setBillerActionType("")
    setBillerAccountNumber("")
    setPaymentIdentifier("")
    setInvoice("")
    setPaymentHash("")
    setTimestamp(new Date().toISOString())
    setOverPerTxnLimit(false)
    setUnderPerTxnMinimum(false)
    setSinpeCheckData({})
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    if(action === 'SELL' || action === 'BILLPAY') {
      fetchInvoice()
    } else {
      submitOrder()
    }
  }

  const submitOrder = async () => {
    if(loading) {
      return false
    }
    setLoading(true)    
    return fetch("/order", {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json; charset=utf-8"
      },
      "body": JSON.stringify({
        apiKey,
        fiatAmount,
        fiatCurrency,
        satAmount,
        action,
        paymentReq,
        paymentDesc,
        phoneNumber,
        billerCategory,
        billerService,
        billerActionType,
        billerAccountNumber,
        invoice,
        paymentHash,
        paymentIdentifier,
        timestamp,
      })
    })
    .then((res) => res.json())
    .then((data) => {
      setLoading(false)

      if(data.error) {
        alert(localized.errors[data.type] || data.message)
        return
      } else if(data.inFlight) {
        setTimeout(() => {
          submitOrder()
        }, 1000)
      } else {
        if(window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({action: "complete", message: localized.orderSuccess, title: localized.orderSuccessTitle, subtext: localized.orderSuccessMessage}))
        } else {
          alert(localized.orderSuccess)
        }

        clearForm()
        setShowInvoiceModal(false)
      }
    })
    .catch((err) => {
      setLoading(false)
      setTimeout(() => {
        submitOrder()
      }, 1000)
    })
  }

  const getTxnRate = (currency) => {
    const currencyPair = `BTC${currency || fiatCurrency}`
    const direction = (action === 'BUY' ? 'toFromPrice' : 'fromToPrice')
    const indexRate = parseFloat(priceData[currencyPair][direction])

    return indexRate
  }

  const calculateMaxFiatAmount = () => {
    const satBalance = getSatBalance()

    const txnRate = getTxnRate()

    const btcAmount = parseFloat(satBalance / 100000000)
    const fiatAmount = parseFloat(btcAmount * txnRate)

    setFiatAmount(Math.floor(fiatAmount).toString())
  }

  const checkLimit = (callback) => {
    if(!action || !fiatAmount || !fiatCurrency || !phoneNumber) {
      if(callback) {
        callback()
      }

      return
    }

    setLoading(true)

    fetch(`/checkLimit?apiKey=${apiKey}&action=${action}&fiatAmount=${fiatAmount}&fiatCurrency=${fiatCurrency}&phoneNumber=${phoneNumber}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        if(data.type) {
          alert(localize(localized.errors, data.type, data.data))
        } else {
          alert(data.message || "An unexpected error has occurred")
        }
      } else if(callback) {  
        callback()     
      }
    })
    .catch((err) => {
      alert(err)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  const calculateSatAmount = (setSat) => {
    if(!fiatAmount || !fiatCurrency || priceData.error) {
      setSatAmount("")
      setOverPerTxnLimit(false)
      setUnderPerTxnMinimum(false)
      return
    }

    const txnRate = getTxnRate()

    const btcAmount = parseFloat(fiatAmount / txnRate)
    const satAmount = btcAmount * 100000000

    if(btcAmount * getTxnRate('CAD') >= 995) {
      setOverPerTxnLimit(true)
      setSatAmount("")
      setPaymentReq("")
      return
    }

    if(Math.round(btcAmount * getTxnRate('CRC')) < 2000) {
      setUnderPerTxnMinimum(true)
      setSatAmount("")
      setPaymentReq("")
      return
    }
    
    if(setSat) {
      setSatAmount(""+Math.round(satAmount))
    } else if(setSat === false) {
      setSatAmount("")
      setPaymentReq("")
    }
    
    setOverPerTxnLimit(false)
    setUnderPerTxnMinimum(false)
  }

  const checkPaymentIdentifier = async (e) => {
    const isCurrentlyChecked = !e.target.checked

    if(isCurrentlyChecked) {
      setDisableButton(true)
    } else if(paymentIdentifier.length !== 25) {
      const conf = window.confirm(localized.paymentIdentifierHelper)
      if(conf) {
        setDisableButton(false)
      } else {
        setDisableButton(true)
      }
    } else {
      setDisableButton(false)
    }
  }

  const handlePaymentReqChange = async (e) => {
    setPaymentReq(e.target.value)
    setSinpeCheckData({})
    setDisableButton(false)
  }

  const handlePaymentDescChange = async (e) => {
    const val = e.target.value.replaceAll(/bitcoin|btc|sats|cripto|crypto|bit |\p{S}/gi, '')

    if(val.length >= 15) {
      val = val.substr(0, 15)
    }

    setPaymentDesc(val)
  }

  const checkPaymentRequest = async () => {
    const isValidIban = ibantools.isValidIBAN(ibantools.electronicFormatIBAN(paymentReq))
    const isValidSinpe = paymentReq.replace(/[^0-9]/gi, '').trim().length === 8

    if(!isValidIban && !isValidSinpe) {
      return false
    }

    setLoading(true)
    setSinpeCheckData({})

    let url = ''
    if(isValidSinpe) {
      url = `/checkPhoneNumberForSinpe?phoneNumber=${paymentReq.replace(/[^0-9]/gi, '').trim()}&apiKey=${apiKey}`
    } else {
      url = `/checkIbanAccount?iban=${ibantools.electronicFormatIBAN(paymentReq)}&apiKey=${apiKey}`
    }
    
    fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(localized.errors[data.type] || data.message)
        return
      } else {
        if(data.data.CodigoMoneda && fiatCurrency && data.data.CodigoMoneda !== fiatCurrency) {
          alert("This account's currency does not match your selected currency for this order.")
          return
        }

        setSinpeCheckData({
          name: data.data.NombreCliente || data.data.NomPropietario,
          currency: data.data.CodigoMoneda || null,
        })

        setDisableButton(false)
      }
    })
    .catch((err) => {
      alert(err)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  const resetTimestamp = () => {
    setTimestamp(new Date().toISOString())
    setInvoice("")
    setPaymentHash("")
    setShowInvoiceModal(false)
  }

  const copyToClipboard = (str) => {
    try {
      navigator.clipboard.writeText(str)
    } catch(e) {
      console.log(e)
    }
  }

  const toggleLoadingOn = () => setLoading(true)
  const toggleLoadingOff = () => setLoading(false)

  submitOrderRef.current = submitOrder
  toggleLoadingOnRef.current = toggleLoadingOn
  toggleLoadingOffRef.current = toggleLoadingOff
  invoiceCreatedRef.current = (bolt11) => setPaymentReq(bolt11)

  useEffect(() => {
    getPriceData()
    setInterval(getPriceData, 1000 * 120)

    getAlert()

    window.addEventListener("submitOrder", (e) => {
      submitOrderRef.current()
    })

    window.addEventListener("toggleLoadingOn", (e) => {
      toggleLoadingOnRef.current()
    })

    window.addEventListener("toggleLoadingOff", (e) => {
      toggleLoadingOffRef.current()
    })

    window.addEventListener("invoiceCreated", (e) => {
      invoiceCreatedRef.current(e.detail.bolt11)
    })

    window.addEventListener("resetTimestamp", (e) => {
      resetTimestamp()
    })

    window.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data)

        switch(data.action) {
          case "submitOrder": 
            submitOrderRef.current()
            break;

          case "toggleLoadingOn":
            toggleLoadingOnRef.current()
            break;

          case "toggleLoadingOff":
            toggleLoadingOffRef.current()
            break;

          case "invoiceCreated":
            invoiceCreatedRef.current(data.bolt11)
            break;

          case "resetTimestamp":
            resetTimestamp()
            break;
        }
      } catch(e) {
        console.log('decode fail', e.data)
      }
    })
  }, [])

  useEffect(() => {
    calculateSatAmount(false)
  }, [fiatAmount, fiatCurrency])

  useEffect(() => {
    if(action === "BUY" && paymentReq === "") {
      calculateSatAmount(true)
    } else if(invoice === "") {
      calculateSatAmount(true)
    }
  }, [priceData])

  useEffect(() => {
    if(window.ReactNativeWebView && username && satAmount && action === 'BUY') {
      window.ReactNativeWebView.postMessage(JSON.stringify({action: "createInvoice", satAmount: satAmount}))
    } else if(isInIframe() && username && satAmount && action === 'BUY') {
      window.top.postMessage(JSON.stringify({action: "createInvoice", satAmount: satAmount}), "*")
    }


  }, [satAmount, fiatCurrency, username, action])

  useEffect(() => {
    if(showInvoiceModal) {
      if(window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({action: "invoice", bolt11: invoice}))
        // setTimeout(() => {
        //   submitOrder()
        // }, 500)
      } else if(isInIframe()) {
        window.top.postMessage(JSON.stringify({action: "invoice", bolt11: invoice}), "*")
      } else {
        submitOrder()
      }
    } else {
      setInvoice("")
      setPaymentHash("")
    }
  }, [showInvoiceModal])

  if(action === 'BUY' && !registeredUser) {
    return (
      <Register clearForm={clearForm} />
    )
  }

  const isValidIban = ibantools.isValidIBAN(ibantools.electronicFormatIBAN(paymentReq))
  const isValidSinpe = paymentReq.replace(/[^0-9]/gi, '').trim().length === 8

  return (
    <div>
      {!isFromBJ() &&
        <div className="container">
          <div className="header">
            <h1 className="text-start">
              {localized.title}
              <select className="float-end" onChange={(e) => setLanguage(e.target.value)} value={language}>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </h1>
          </div>
          {!apiKey &&
            <div className="mb-1">
              <label htmlFor="apiKey" className="form-label">{localized.apiKeyTitle}</label>
              <input type="password" className="form-control" id="apiKey" onBlur={(e) => setApiKey(e.target.value)} />
              <div className="form-text">{localized.apiKeyHelper}</div>
            </div>
          }
        </div>
      }

      <div className="text-center mt-1 mb-1">
        <img src="/bull-bitcoin-banner-logo.png" className={`bull-logo ${action ? "small" : ""}`} />
      </div>

      {systemAlert && systemAlert.active == true &&
        <div className="container text-center">
          <div className="alert alert-danger">
            🚨<b>{localized.statusUpdateTitle}</b>🚨
            <br />{new Date(systemAlert.timestamp).toLocaleString()}
            <br />{systemAlert.message}
          </div>
        </div>
      }

      <div className="container d-flex">
        {apiKey &&
          <form id="addOrder" className="d-flex flex-grow-1 justify-content-center align-items-center" onSubmit={(e) => e.preventDefault()}>

            {!action &&
              <div className="well">
                <p>
                  <b>{localized.step} 1</b>
                  {" "}
                  {localized.step1Title}
                </p>
                <div className="row action-buttons mb-1">
                  <div className="col-12">
                    <button className={(action === "BUY" ? "btn btn-warning" : "btn bg-white btn-secondary text-dark") + " align-middle"} onClick={() => handleAction("BUY")}>
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="p-1">
                          <SendReceiveIcon isReceive={true} size={50} />
                        </div>
                        <div className="text-start w-75">
                          <div>
                            <span className="align-middle">
                              {localized.buyBtn}
                            </span>
                          </div>
                          <div>
                            <span className="fs-6 fw-light mt-1 align-top">{localized.buyBtnHelper}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="col-12" style={{height: 40}}></div>
                  <div className="col-12">
                    <button className={(action === "SELL" ? "btn btn-warning" : "btn bg-white btn-secondary text-dark") + " align-middle"} onClick={() => handleAction("SELL")}>
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="p-1">
                          <SendReceiveIcon size={50} />
                        </div>
                        <div className="text-start w-75">
                          <div>
                            <span className="align-middle">
                              {localized.sellBtn}
                            </span>
                          </div>
                          <div>
                            <span className="fs-6 fw-light mt-1 align-top">{localized.sellBtnHelper}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  {/*<div className="col">
                    <button className={(action === "BILLPAY" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => handleAction("BILLPAY")}>{localized.billPayBtn}</button>
                  </div>*/}
                </div>
              </div>
            }

            {action && 
              <div>

                <div className="well">
                  <p>
                    <b>{localized.step} 2</b>
                    {" "}
                    {localized.step2Title} {localized[action.toLowerCase()]}.
                  </p>

                  <div className="row mb-1">
                    <div className="col-12 mb-1">
                      <label htmlFor="fiatAmount" className="form-label">{localized.fiatAmountTitle}</label>
                      <div className="input-group">
                        <input type="text" className="form-control" id="fiatAmount" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
                        {getSatBalance() && action === 'SELL' && 
                          <span class="input-group-text" id="fiatAmount-addon">
                            <button className="btn btn-warning fs-6 btn-sm" onClick={calculateMaxFiatAmount}>
                              Max
                            </button>
                          </span>
                        }
                      </div>
                      <div className="form-text">{localized.fiatAmountHelper}</div>
                    </div>

                    <div className="col-12 mb-1">
                      <label htmlFor="fiatCurrency" className="form-label">{localized.fiatCurrencyTitle}</label>
                      <select className="form-control" id="fiatCurrency" value={fiatCurrency} onChange={(e) => setFiatCurrency(e.target.value)}>
                        <option value="CRC">{localized.crc}</option>
                        <option value="USD">{localized.usd}</option>
                      </select>
                      <div className="form-text">{localized.fiatCurrencyHelper}</div>
                    </div>

                    <div className="col-12">
                      {/*<label htmlFor="satAmount" className="form-label">{localized.satAmountTitle}</label>
                      <input type="text" className="form-control" id="satAmount" value={satAmount} readOnly={true} />
                      <div className="form-text">{localized.satAmountHelper} <span style={{fontWeight: "bold"}} id="price-timestamp">{priceData.timestamp || priceData.message}</span></div>
                      */}
                      {satAmount &&
                        <span>
                          {
                            Number(fiatAmount).toLocaleString(
                              (language === 'es' ? 'es-CR' : 'en-US'), 
                              {
                                currency: fiatCurrency,
                                style: "decimal",
                                maximumFractionDigits: (fiatCurrency === 'CRC' ? 0 : 2),
                                minimumFractionDigits: (fiatCurrency === 'CRC' ? 0 : 2),
                              }
                            )
                          }
                          {" " + fiatCurrency + " "} 
                          = 
                          {" "}
                          {
                            Number(satAmount).toLocaleString(
                              (language === 'es' ? 'es-CR' : 'en-US'), 
                              {
                                style: "decimal",
                                maximumFractionDigits: 0,
                                minimumFractionDigits: 0,
                              }
                            )
                          }
                          {" "}
                          satoshis
                          <br />
                          (1 BTC = {" "}
                            {
                              Number((fiatAmount / satAmount) * 100000000).toLocaleString(
                                (language === 'es' ? 'es-CR' : 'en-US'), 
                                {
                                  currency: fiatCurrency,
                                  style: "decimal",
                                  maximumFractionDigits: (fiatCurrency === 'CRC' ? 0 : 2),
                                  minimumFractionDigits: (fiatCurrency === 'CRC' ? 0 : 2),
                                }
                              )
                            }
                            {" " + fiatCurrency}
                          )
                        </span>
                      }

                      {!satAmount &&
                        <button className="btn btn-primary btn-sm" onClick={() => checkLimit(() => { calculateSatAmount(true) } )} disabled={overPerTxnLimit || underPerTxnMinimum}>
                          {overPerTxnLimit &&
                            <>{localized.overPerTxnLimit}</>
                          }

                          {underPerTxnMinimum &&
                            <>{localized.underPerTxnMinimum}</>
                          }

                          {!overPerTxnLimit && !underPerTxnMinimum && 
                            <>{localized.continue}</>
                          }
                        </button>
                      }                      
                    </div>
                  </div>
                </div>

                {fiatAmount && fiatCurrency && satAmount && !overPerTxnLimit && 
                  <div>

                    {!isFromBJ() && 
                      <div className="well">
                        <p>
                          <b>{localized.step} 3</b>
                          {" "}
                          {localized.step3Title}
                        </p>

                        <div className="mb-1">
                          <label htmlFor="phoneNumber" className="form-label">{localized.phoneNumberTitle}</label>
                          <input className="form-control" id="phoneNumber" value={phoneNumber} onChange={(e) => { setPhoneNumber(e.target.value) } }/>
                          <div className="form-text">{localized.phoneNumberHelper}</div>
                        </div>
                      </div>
                    }

                    {action === 'SELL' && phoneNumber && 
                      <div className="well">
                        <p>
                          <b>{localized.step} {isFromBJ() ? "3" : "4"}</b>
                          {" "}
                          {localized.step4Title}
                        </p>
                        <div className="paymentReqContainer mb-1">
                          <input className="form-control" id="paymentReq" value={paymentReq} onChange={handlePaymentReqChange} />
                          <div className="form-text">{localized.sellPaymentReqHelper}</div>
                        </div>
                        <div className="mb-1">
                          {(isValidSinpe || isValidIban) && !sinpeCheckData.name &&
                            <button className="btn btn-warning btn-sm" onClick={checkPaymentRequest} disabled={loading}>
                              {loading &&
                                <div className="spinner-border" role="status" style={{width: "1rem", height: "1rem"}}>
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              }
                              {(isValidSinpe ? localized.verifyNumber : localized.verifyIban)}
                            </button>
                          }
                          {sinpeCheckData.name &&
                            <div className="alert alert-info mb-0">
                              {(isValidSinpe ? localized.numberVerifiedTo : localized.ibanVerifiedTo)} {sinpeCheckData.name}
                            </div>
                          }
                        </div>
                      </div>
                    }

                    {action === 'SELL' && phoneNumber && (isValidSinpe || isValidIban) &&
                      <div className="well">
                        <p>
                          <b>{localized.step} {isFromBJ() ? "4" : "5"}</b>
                          {" "}
                          {localized.step6Title}
                        </p>
                        <div className="paymentDescContainer mb-1">
                          <input className="form-control" id="paymentDesc" value={paymentDesc} onChange={handlePaymentDescChange} />
                          <div className="form-text">{localized.sellPaymentDescHelper}</div>
                        </div>
                      </div>
                    }

                    {action === 'BUY' && phoneNumber && registeredUser &&
                      <div className="paymentReqContainer mb-1">

                        {!isFromBJ() && 
                          <div className="well">
                            <p>
                              <b>{localized.step} 4</b>
                              {" "}
                              {localized.step4Title}
                            </p>
                            <div className="row action-buttons mb-1">

                              <div className="mb-1">
                                <label htmlFor="username" className="form-label">{localized.bitcoinJungleWallet}</label>
                                <div className="input-group">
                                  <input className="form-control" id="username" value={username} onChange={(e) => { setUsername(e.target.value); setPaymentReq("") } } />
                                  <div class="input-group-append">
                                    <span class="input-group-text" id="basic-addon2">
                                      <button className="btn btn-success fs-6 btn-small" onClick={generateUserInvoice}>
                                        {localized.confirm} ➡️
                                      </button>
                                    </span>
                                  </div>
                                </div>
                                <div className="form-text">{localized.bjUsernamePrompt}</div>
                              </div>
                            </div>
                          </div>
                        }

                        {paymentReq &&
                          <div className="well">
                            <p>
                              <b>{localized.step} {isFromBJ() ? "3" : "5"}</b>
                              {" "}
                              {localized.step5Title}
                            </p>
                            <Rules 
                              localized={localized} />
                            <div className="alert alert-info">
                              <p>
                                <b>{localized.paymentOptionsTitle}</b>
                                <br />
                                <span>
                                  {localize(
                                    localized, 
                                    'paymentOptionsInstructionBefore',
                                    {
                                      fiatAmount, 
                                      fiatCurrency: localized[fiatCurrency.toLowerCase()],
                                    }
                                  )}
                                </span>
                                <br />
                                <ul className="accountList">
                                  <li>
                                    <span onClick={() => copyToClipboard('87833773')}>
                                      📋
                                    </span>
                                    {" "}
                                    8783-3773 (Sinpe Móvil)
                                  </li>
                                  <li>
                                    <span onClick={() => copyToClipboard('CR06090100002792137502')}>
                                      📋
                                    </span>
                                    {" "}
                                    CR06090100002792137502 ({localized.crcAccount})
                                  </li>
                                  <li>
                                    <span onClick={() => copyToClipboard('CR76090100002792137503')}>
                                      📋
                                    </span>
                                    {" "}
                                    CR76090100002792137503 ({localized.usdAccount})
                                  </li>
                                </ul>
                                <span>
                                  {localized.paymentIdNumber}
                                </span>
                                <br />
                                <br />
                                <span>
                                  {localize(
                                    localized, 
                                    'paymentOptionsInstructionAfter',
                                    {
                                      fiatAmount, 
                                      fiatCurrency: localized[fiatCurrency.toLowerCase()],
                                    }
                                  )}
                                </span>
                                <div className="mb-1 mt-3">
                                  <label htmlFor="paymentIdentifier" className="form-label">{localized.paymentIdentifierTitle}</label>
                                  <input type="text" className="form-control" id="paymentIdentifier" value={paymentIdentifier} onChange={(e) => {
                                    setDisableButton(true)
                                    setPaymentIdentifier(e.target.value.replace(/[^0-9]/gi, ''))
                                  }} />
                                  {paymentIdentifier.length > 0 && paymentIdentifier.length !== 25 &&
                                    <div className="form-text">{localized.paymentIdentifierHelper}</div>
                                  }
                                </div>
                                <br />
                                <div className="form-check form-switch">
                                  <input className="form-check-input" type="checkbox" role="switch" id="buyConfirmationCheckbox" onChange={(e) => {checkPaymentIdentifier(e)}} checked={!disableButton} />
                                  <label className="form-check-label" for="buyConfirmationCheckbox">{localized.paymentConfirmationLabel}</label>
                                </div>
                              </p>
                            </div>
                          </div>
                        }
                      </div>
                    }

                    {action === 'BILLPAY' &&
                      <div className="well">
                        <p>
                          <b>{localized.step} 4</b>
                          {" "}
                          {localized.step4Title}
                        </p>
                        <div className="paymentReqContainer mb-1">
                          <div className="mb-1">
                            <label htmlFor="billerCategory" className="form-label">{localized.billerCategoryTitle}</label>
                            <input type="text" className="form-control" id="billerCategory" value={billerCategory} onChange={(e) => { setBillerCategory(e.target.value); setDisableButton(false) } }/>
                          </div>

                          <div className="mb-1">
                            <label htmlFor="billerService" className="form-label">{localized.billerServiceTitle}</label>
                            <input type="text" className="form-control" id="billerService" value={billerService} onChange={(e) => { setBillerService(e.target.value); setDisableButton(false) } }/>
                          </div>

                          <div className="mb-1">
                            <label htmlFor="billerActionType" className="form-label">{localized.billerActionTypeTitle}</label>
                            <input type="text" className="form-control" id="billerActionType" value={billerActionType} onChange={(e) => { setBillerActionType(e.target.value); setDisableButton(false) } }/>
                          </div>

                          <div className="mb-1">
                            <label htmlFor="billerAccountNumber" className="form-label">{localized.billerAccountNumberTitle}</label>
                            <input type="text" className="form-control" id="billerAccountNumber" value={billerAccountNumber} onChange={(e) =>{ setBillerAccountNumber(e.target.value); setDisableButton(false) } }/>
                          </div>
                        </div>
                      </div>
                    }

                    <div className="well">
                      <div className="submit-container mb-1 mt-1">
                        <button id="submit-btn" type="submit" className="btn btn-primary" disabled={loading || disableButton || overPerTxnLimit} onClick={handleFormSubmit}>{localized[`createOrder${action}`]}</button>
                        {loading &&
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        }
                      </div>
                    </div>

                  </div>
                }

              </div>
            }
          </form>
        }
      </div>

      <footer className="mt-3 mb-1">
        <div className="container">
          <span className="text-muted">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setShowTermsModal(true)
              }}
            >
              {localized.terms}
            </a>
            {" | "}
            <a href="whatsapp:+50687833773">
              {localized.support}
            </a>
            {" | "}
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setShowChartModal(!showChartModal)
              }}
            >
              {(showChartModal ? localized.hidePriceHistory : localized.showPriceHistory)}
            </a>
          </span>
          {showChartModal &&
            <div>
              <Chart
                localized={localized}
                language={language}
                apiKey={apiKey} 
              />
            </div>
          }
        </div>
      </footer>

      <Modal showModal={showInvoiceModal && !window.ReactNativeWebView && !isInIframe()}>
        <Invoice 
          localized={localized}
          invoice={invoice} />
      </Modal>

      <Modal showModal={showTermsModal} toggle={setShowTermsModal}>
        <iframe src="https://bullbitcoin.com/faq/Costa%2520Rica#about-faq--1473451305" title={localized.terms} style={{height: "80vh"}} />
      </Modal>
    </div>
  )
}

export default Main;
