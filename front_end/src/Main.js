import { useState, useEffect, useRef } from 'react'

import localizeText from './lang/index'
import { getApiKey, getPhoneNumber, getUsername, getLanguage, isFromBJ } from './utils/index'

import { SendReceiveIcon } from './components/SendReceiveIcon'
import Modal from './components/Modal'

import { 
  RECIPIENT_WALLET_ID, 
  LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT,
} from './utils/graphql'

function Main({ client }) {
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
  const [billerCategory, setBillerCategory] = useState("")
  const [billerService, setBillerService] = useState("")
  const [billerActionType, setBillerActionType] = useState("")
  const [billerAccountNumber, setBillerAccountNumber] = useState("")
  const [invoice, setInvoice] = useState("")
  const [paymentHash, setPaymentHash] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [paymentIdentifier, setPaymentIdentifier] = useState("")
  const [timestamp, setTimestamp] = useState(new Date().toISOString())
  const [phoneNumber, setPhoneNumber] = useState(getPhoneNumber())
  const [username, setUsername] = useState(getUsername())
  const [overPerTxnLimit, setOverPerTxnLimit] = useState(false)
  const [underPerTxnMinimum, setUnderPerTxnMinimum] = useState(false)

  const localized = localizeText(language)

  const handleAction = (action) => {
    clearForm()
    setAction(action)
    setDisableButton(true)
  }

  const handleModal = (action) => {
    setShowModal(action)

    if(!action) {
      setTimestamp(new Date().toISOString())
    }
  }

  const fetchInvoice = () => {
    if(!fiatAmount) {
      alert("fiatAmount is required.")
      return false
    }

    if(!fiatCurrency) {
      alert("fiatCurrency is required.")
      return false
    }

    if(!satAmount) {
      alert("satAmount is required.")
      return false
    }

    if(!action) {
      alert("action is required.")
      return false
    }

    if(action !== 'BILLPAY' && !paymentReq) {
      alert("Payment Destination is required.")
      return false
    }

    if(action === 'BILLPAY' && (!billerCategory || !billerService || !billerActionType || !billerAccountNumber)) {
      alert("When action is BILLPAY, you must provide billerCategory, billerService, billerActionType, billerAccountNumber")
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

    setLoading(true)
    
    fetch("/invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        apiKey: apiKey,
        label: timestamp,
        description: `${fiatAmount} ${fiatCurrency} (${satAmount} sats) to ${paymentReq}`,
        satAmount: satAmount,
      })
    })
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message || data.error.message)
        return
      } else {
        setInvoice(data.result.bolt11)
        setPaymentHash(data.result.payment_hash)
        setShowModal(true)
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
    fetch("/price")
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
        alert(data.message)
        return
      } else if(data.inFlight) {
        setTimeout(() => {
          submitOrder()
        }, 1000)
      } else {
        if(window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({action: "complete"}))
        } else {
          alert("Order created successfully!")
        }

        clearForm()
        setShowModal(false)
      }
    })
    .catch((err) => {
      setLoading(false)
      setTimeout(() => {
        submitOrder()
      }, 1000)
    })
  }

  const calculateSatAmount = (setSat) => {
    if(!fiatAmount || !fiatCurrency || priceData.error) {
      setSatAmount("")
      setOverPerTxnLimit(false)
      setUnderPerTxnMinimum(false)
      return
    }

    const indexRate = parseFloat(priceData[`BTC${fiatCurrency}`])
    let txnRate = indexRate

    if(action === "SELL") {
      txnRate = indexRate * 0.98
    } else if (action === "BILLPAY") {
      txnRate = indexRate * 0.98
    }

    const btcAmount = parseFloat(fiatAmount / txnRate)
    const satAmount = btcAmount * 100000000

    if(btcAmount * priceData['BTCCAD'] >= 995) {
      setOverPerTxnLimit(true)
      return
    }

    if(btcAmount * priceData['BTCCRC'] < 5000) {
      setUnderPerTxnMinimum(true)
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

  const toggleLoadingOn = () => setLoading(true)
  const toggleLoadingOff = () => setLoading(false)

  submitOrderRef.current = submitOrder
  toggleLoadingOnRef.current = toggleLoadingOn
  toggleLoadingOffRef.current = toggleLoadingOff
  invoiceCreatedRef.current = (bolt11) => setPaymentReq(bolt11)

  useEffect(() => {
    getPriceData()
    setInterval(getPriceData, 1000 * 120)

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
  }, [])

  useEffect(() => {
    calculateSatAmount(false)
  }, [fiatAmount, fiatCurrency, priceData])

  useEffect(() => {
    if(window.ReactNativeWebView && username && satAmount && action === 'BUY') {
      window.ReactNativeWebView.postMessage(JSON.stringify({action: "createInvoice", satAmount: satAmount}))
    }
  }, [satAmount, fiatCurrency, username, action])

  useEffect(() => {
    if(showModal) {
      if(window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({action: "invoice", bolt11: invoice}))
        // setTimeout(() => {
        //   submitOrder()
        // }, 500)
      } else {
        submitOrder()
      }
    } else {
      setInvoice("")
      setPaymentHash("")
    }
  }, [showModal])

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
            <div className="mb-3">
              <label htmlFor="apiKey" className="form-label">{localized.apiKeyTitle}</label>
              <input type="password" className="form-control" id="apiKey" onBlur={(e) => setApiKey(e.target.value)} />
              <div className="form-text">{localized.apiKeyHelper}</div>
            </div>
          }
        </div>
      }

      <div className="text-center mt-3 mb-3">
        <img src="/bull-bitcoin-banner-logo.png" className="bull-logo" />
      </div>

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
                <div className="row action-buttons mb-3">
                  <div className="col-12">
                    <button className={(action === "BUY" ? "btn btn-warning" : "btn bg-white btn-secondary text-dark") + " align-middle"} onClick={() => handleAction("BUY")}>
                      <SendReceiveIcon isReceive={true} size={18} />
                      {" "}
                      <span className="align-middle">
                        {localized.buyBtn}
                      </span>
                    </button>
                  </div>
                  <div className="col-12" style={{height: 40}}></div>
                  <div className="col-12">
                    <button className={(action === "SELL" ? "btn btn-warning" : "btn bg-white btn-secondary text-dark") + " align-middle"} onClick={() => handleAction("SELL")}>
                      <SendReceiveIcon />
                      {" "}
                      <span className="align-middle">
                        {localized.sellBtn}
                      </span>
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

                  <div className="row mb-3">
                    <div className="col-12 mb-3">
                      <label htmlFor="fiatAmount" className="form-label">{localized.fiatAmountTitle}</label>
                      <input type="text" className="form-control" id="fiatAmount" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
                      <div className="form-text">{localized.fiatAmountHelper}</div>
                    </div>

                    <div className="col-12 mb-3">
                      <label htmlFor="fiatCurrency" className="form-label">{localized.fiatCurrencyTitle}</label>
                      <select className="form-control" id="fiatCurrency" value={fiatCurrency} onChange={(e) => setFiatCurrency(e.target.value)}>
                        <option value="CRC">CRC</option>
                        <option value="USD">USD</option>
                      </select>
                      <div className="form-text">{localized.fiatCurrencyHelper}</div>
                    </div>

                    <div className="col-12">
                      {/*<label htmlFor="satAmount" className="form-label">{localized.satAmountTitle}</label>
                      <input type="text" className="form-control" id="satAmount" value={satAmount} readOnly={true} />
                      <div className="form-text">{localized.satAmountHelper} <span style={{fontWeight: "bold"}} id="price-timestamp">{priceData.timestamp || priceData.message}</span></div>
                      */}
                      {satAmount &&
                        <span>= {satAmount} satoshis</span>
                      }

                      {!satAmount &&
                        <button className="btn btn-warning btn-sm" onClick={() => calculateSatAmount(true)} disabled={overPerTxnLimit || underPerTxnMinimum}>
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

                        <div className="mb-3">
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
                        <div className="paymentReqContainer mb-3">
                          <input className="form-control" id="paymentReq" value={paymentReq} onChange={(e) => { setPaymentReq(e.target.value); setDisableButton(false) } }/>
                          <div className="form-text">{localized.sellPaymentReqHelper}</div>
                        </div>
                      </div>
                    }

                    {action === 'BUY' && phoneNumber && 
                      <div className="paymentReqContainer mb-3">

                        {!isFromBJ() && 
                          <div className="well">
                            <p>
                              <b>{localized.step} 4</b>
                              {" "}
                              {localized.step4Title}
                            </p>
                            <div className="row action-buttons mb-3">

                              <div className="mb-3">
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
                            <div className="alert alert-info">
                              <p>
                                <b>{localized.paymentOptionsTitle}</b>
                                <br />
                                <span>{localized.paymentOptionsInstructionBefore} {fiatAmount} {fiatCurrency} {localized.paymentOptionsInstructionsAfter}:</span>
                                <ul>
                                  <li>Sinpe Móvil {localized.to} 8783-3773</li>
                                  <li>CR06090100002792137502 ({localized.crcAccount})</li>
                                  <li>CR76090100002792137503 ({localized.usdAccount})</li>
                                </ul>
                                
                                <div className="mb-3">
                                  <label htmlFor="paymentIdentifier" className="form-label">{localized.paymentIdentifierTitle}</label>
                                  <input type="text" className="form-control" id="paymentIdentifier" value={paymentIdentifier} onChange={(e) => setPaymentIdentifier(e.target.value)} />
                                </div>

                                <br />
                                <div className="form-check form-switch">
                                  <input className="form-check-input" type="checkbox" role="switch" id="buyConfirmationCheckbox" onChange={(e) => setDisableButton(!e.target.checked)} />
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
                        <div className="paymentReqContainer mb-3">
                          <div className="mb-3">
                            <label htmlFor="billerCategory" className="form-label">{localized.billerCategoryTitle}</label>
                            <input type="text" className="form-control" id="billerCategory" value={billerCategory} onChange={(e) => { setBillerCategory(e.target.value); setDisableButton(false) } }/>
                          </div>

                          <div className="mb-3">
                            <label htmlFor="billerService" className="form-label">{localized.billerServiceTitle}</label>
                            <input type="text" className="form-control" id="billerService" value={billerService} onChange={(e) => { setBillerService(e.target.value); setDisableButton(false) } }/>
                          </div>

                          <div className="mb-3">
                            <label htmlFor="billerActionType" className="form-label">{localized.billerActionTypeTitle}</label>
                            <input type="text" className="form-control" id="billerActionType" value={billerActionType} onChange={(e) => { setBillerActionType(e.target.value); setDisableButton(false) } }/>
                          </div>

                          <div className="mb-3">
                            <label htmlFor="billerAccountNumber" className="form-label">{localized.billerAccountNumberTitle}</label>
                            <input type="text" className="form-control" id="billerAccountNumber" value={billerAccountNumber} onChange={(e) =>{ setBillerAccountNumber(e.target.value); setDisableButton(false) } }/>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }

                <div className="well">
                  <div className="submit-container mb-3">
                    <button id="submit-btn" type="submit" className="btn btn-primary" disabled={loading || disableButton || overPerTxnLimit} onClick={handleFormSubmit}>{localized.submitBtnTitle}</button>
                    {loading &&
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    }
                  </div>
                </div>

              </div>
            }
          </form>
        }
      </div>

      <footer className="mt-3 mb-1">
        <div className="container">
          <span className="text-muted">
            <a href="https://bullbitcoin.com/faq/Costa%2520Rica" target="_blank">{localized.terms}</a>
          </span>
        </div>
      </footer>

      <Modal
        showModal={showModal && !window.ReactNativeWebView}
        handleModal={handleModal}
        localized={localized}
        invoice={invoice} />

    </div>
  )
}

export default Main;
