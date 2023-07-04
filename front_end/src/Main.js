import './App.css'

import { useState, useEffect } from 'react'

import localizeText from './lang/index'
import { getApiKey, getPhoneNumber, getUsername } from './utils/index'

import Modal from './components/Modal'

import { 
  RECIPIENT_WALLET_ID, 
  LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT,
} from './utils/graphql'

let interval

function Main({ client }) {
  const [language, setLanguage] = useState(navigator.language || navigator.userLanguage || 'en')

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
  const [showPaymentReq, setShowPaymentReq] = useState(false)
  const [timestamp, setTimestamp] = useState(new Date().toISOString())
  const [phoneNumber, setPhoneNumber] = useState(getPhoneNumber())
  const [username, setUsername] = useState(getUsername())
  const [overPerTxnLimit, setOverPerTxnLimit] = useState(false)

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

  const checkInvoice = async () => {
    fetch("/checkInvoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        apiKey: apiKey,
        label: timestamp,
      })
    })
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message || data.error.message)
        return
      } else if(data.result.status === 'paid') {
        setShowModal(false)
        submitOrder()
      }
    })
    .catch((err) => {
      alert(err)
    })
  }

  const generateUserInvoice = async () => {
    setShowPaymentReq(false)
    setLoading(true)
    let usernameToSend

    if(username) {
      usernameToSend = username
    } else {
      usernameToSend = prompt(localized.bjUsernamePrompt)

      if(!usernameToSend) {
        return
      }
    }

    try {
      const response = await client.query({
        query: RECIPIENT_WALLET_ID,
        variables: {
          username: usernameToSend,
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
    setShowPaymentReq(false)
    setTimestamp(new Date().toISOString())
    setOverPerTxnLimit(false)
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
      if(data.error) {
        alert(data.message)
        return
      } else {
        alert("Order created successfully!")
      }

      clearForm()
    })
    .catch((err) => {
      alert(err)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    getPriceData()
    setInterval(getPriceData, 1000 * 120)
  }, [])

  useEffect(() => {
    const calculateSatAmount = () => {
      if(!fiatAmount || !fiatCurrency || priceData.error) {
        setSatAmount("")
        setOverPerTxnLimit(false)
        return
      }

      if(paymentReq) {
        return
      }

      const btcAmount = parseFloat(fiatAmount) / parseFloat(priceData[`BTC${fiatCurrency}`])
      const satAmount = btcAmount * 100000000

      if(btcAmount * priceData['BTCCAD'] >= 995) {
        setOverPerTxnLimit(true)
        return
      }
      
      setSatAmount(""+Math.round(satAmount))
      setOverPerTxnLimit(false)
    }

    calculateSatAmount()
  }, [fiatAmount, fiatCurrency, priceData, satAmount, paymentReq])

  useEffect(() => {
    if(showModal && !interval) {
      interval = setInterval(checkInvoice, 1000 * 1)
    } else if (!showModal && interval) {
      interval = clearInterval(interval)
    }
  }, [showModal])

  return (
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
      {apiKey &&
        <form id="addOrder" onSubmit={(e) => e.preventDefault()}>

          <div className="well">
            <p>
              <b>{localized.step} 1</b>
              {" "}
              {localized.step1Title}
            </p>
            <div className="row action-buttons mb-3">
              <div className="col">
                <button className={(action === "BUY" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => handleAction("BUY")}>{localized.buyBtn}</button>
              </div>
              <div className="col">
                <button className={(action === "SELL" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => handleAction("SELL")}>{localized.sellBtn}</button>
              </div>
              {/*<div className="col">
                <button className={(action === "BILLPAY" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => handleAction("BILLPAY")}>{localized.billPayBtn}</button>
              </div>*/}
            </div>
          </div>

          {action && 
            <div>
              <div className="well">
                <p>
                  <b>{localized.step} 2</b>
                  {" "}
                  {localized.step2Title} {localized[action.toLowerCase()]}.
                </p>

                <div className="row mb-3">
                  <div className="col">
                    <label htmlFor="fiatAmount" className="form-label">{localized.fiatAmountTitle}</label>
                    <input type="text" className="form-control" id="fiatAmount" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
                    <div className="form-text">{localized.fiatAmountHelper}</div>
                  </div>

                  <div className="col">
                    <label htmlFor="fiatCurrency" className="form-label">{localized.fiatCurrencyTitle}</label>
                    <select className="form-control" id="fiatCurrency" value={fiatCurrency} onChange={(e) => setFiatCurrency(e.target.value)}>
                      <option value="CRC">CRC</option>
                      <option value="USD">USD</option>
                    </select>
                    <div className="form-text">{localized.fiatCurrencyHelper}</div>
                  </div>

                  <div className="col">
                    <label htmlFor="satAmount" className="form-label">{localized.satAmountTitle}</label>
                    <input type="text" className="form-control" id="satAmount" value={satAmount} readOnly={true} />
                    <div className="form-text">{localized.satAmountHelper} <span style={{fontWeight: "bold"}} id="price-timestamp">{priceData.timestamp || priceData.message}</span></div>
                  </div>
                </div>

                {overPerTxnLimit &&
                  <div className="alert alert-danger">{localized.overPerTxnLimit}</div>
                }
              </div>

              {fiatAmount && fiatCurrency && satAmount && !overPerTxnLimit && 
                <div>
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

                  {action === 'SELL' && phoneNumber && 
                    <div className="well">
                      <p>
                        <b>{localized.step} 4</b>
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

                      <div className="well">
                        <p>
                          <b>{localized.step} 4</b>
                          {" "}
                          {localized.step4Title}
                        </p>
                        <div className="row action-buttons mb-3">
                          <div className="col">
                           <button className={(paymentReq && !showPaymentReq ? "btn btn-primary" : "btn btn-secondary")} disabled={loading} onClick={generateUserInvoice}>{localized.bitcoinJungleWallet}{(username ? ` (${username})` : '')}</button>
                          </div>
                          <div className="col">
                            <button className={(showPaymentReq ? "btn btn-primary" : "btn btn-secondary")} disabled={loading} onClick={setShowPaymentReq}>{localized.lightningWallet}</button>
                          </div>
                        </div>
                        {showPaymentReq &&
                          <div className="mb-3">
                            <textarea className="form-control" id="paymentReq" value={paymentReq} onChange={(e) => setPaymentReq(e.target.value)}></textarea>
                            <div className="form-text">{localized.buyPaymentReqHelper}</div>
                          </div>
                        }
                      </div>

                      {paymentReq &&
                        <div className="well">
                          <p>
                            <b>{localized.step} 5</b>
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

      <Modal
        showModal={showModal}
        handleModal={handleModal}
        localized={localized}
        invoice={invoice} />

    </div>
  )
}

export default Main;
