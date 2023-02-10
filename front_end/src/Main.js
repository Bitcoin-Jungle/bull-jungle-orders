import './App.css'

import { useState, useEffect } from 'react'

import localizeText from './lang/index'
import { getApiKey } from './utils/index'

import Modal from './components/Modal'

import { 
  RECIPIENT_WALLET_ID, 
  LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT,
} from './utils/graphql'

function Main({ client }) {
  const [language, setLanguage] = useState('en')

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
  const [showModal, setShowModal] = useState(false)
  const [paymentIdentifier, setPaymentIdentifier] = useState("")
  const [showPaymentReq, setShowPaymentReq] = useState(false)

  const localized = localizeText(language)

  const handleAction = (action) => {
    clearForm()
    setAction(action)
    setDisableButton(true)
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

    if(!paymentReq) {
      alert("Payment Destination is required.")
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
        label: `${fiatAmount} ${fiatCurrency} (${satAmount} sats) to ${paymentReq}`,
        description: `${fiatAmount} ${fiatCurrency} (${satAmount} sats) to ${paymentReq}`,
        satAmount: satAmount,
      })
    })
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message)
        return
      } else {
        setInvoice(data.result.bolt11)
        setShowModal(true)
      }
    })
    .catch((err) => {
      alert(err)
    })
    .finally(() => {
      setLoading(false)
    })

    //later to confirm
    // setShowModal(false)
    // submitOrder()
  }

  const generateUserInvoice = async () => {
    setShowPaymentReq(false)
    const username = prompt(localized.bjUsernamePrompt)

    if(!username) {
      return
    }

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
    } catch(err) {
      alert(err.toString())
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
    setBillerCategory("")
    setBillerService("")
    setBillerActionType("")
    setBillerAccountNumber("")
    setPaymentIdentifier("")
    setInvoice("")
    setShowPaymentReq(false)
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
        billerCategory,
        billerService,
        billerActionType,
        billerAccountNumber,
        invoice,
        paymentIdentifier,
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
        return
      }

      if(paymentReq) {
        return
      }

      const satAmount = parseFloat(fiatAmount) / parseFloat(priceData[`BTC${fiatCurrency}`]) * 100000000
      setSatAmount(""+Math.round(satAmount))
    }

    calculateSatAmount()
  }, [fiatAmount, fiatCurrency, priceData, satAmount, paymentReq])

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

          <div className="row action-buttons mb-3">
            <div className="col">
              <button className={(action === "BUY" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => handleAction("BUY")}>{localized.buyBtn}</button>
            </div>
            <div className="col">
              <button className={(action === "SELL" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => handleAction("SELL")}>{localized.sellBtn}</button>
            </div>
            <div className="col">
              <button className={(action === "BILLPAY" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => handleAction("BILLPAY")}>{localized.billPayBtn}</button>
            </div>
          </div>

          {action && 
            <div>

              <div className="row mb-3">
                <div className="col">
                  <label htmlFor="fiatAmount" className="form-label">{localized.fiatAmountTitle}</label>
                  <input type="text" className="form-control" id="fiatAmount" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} />
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

              {fiatAmount && fiatCurrency && satAmount &&
                <div>
                  {action === 'SELL' &&
                    <div className="paymentReqContainer mb-3">
                      <label htmlFor="paymentReq" className="form-label">{localized.paymentReqTitle}</label>
                      <input className="form-control" id="paymentReq" value={paymentReq} onChange={(e) => { setPaymentReq(e.target.value); setDisableButton(false) } }/>
                      <div className="form-text">{localized.sellPaymentReqHelper}</div>
                    </div>
                  }

                  {action === 'BUY' &&
                    <div className="paymentReqContainer mb-3">

                      <div className="row action-buttons mb-3">
                        <div className="mb-3">
                          <label htmlFor="fiatAmount" className="form-label">{localized.paymentReqTitle}</label>
                        </div>
                        <div className="col">
                         <button className={(paymentReq && !showPaymentReq ? "btn btn-primary" : "btn btn-secondary")} onClick={generateUserInvoice}>{localized.bitcoinJungleWallet}</button>
                        </div>
                        <div className="col">
                          <button className={(showPaymentReq ? "btn btn-primary" : "btn btn-secondary")} onClick={setShowPaymentReq}>{localized.lightningWallet}</button>
                        </div>
                      </div>

                      {showPaymentReq &&
                        <div className="mb-3">
                          <textarea className="form-control" id="paymentReq" value={paymentReq} onChange={(e) => setPaymentReq(e.target.value)}></textarea>
                          <div className="form-text">{localized.buyPaymentReqHelper}</div>
                        </div>
                      }

                      {paymentReq &&
                        <div className="alert alert-info">
                          <p>
                            <b>{localized.paymentOptionsTitle}</b>
                            <br />
                            <span>{localized.paymentOptionsInstructionBefore} {fiatAmount} {fiatCurrency} {localized.paymentOptionsInstructionsAfter}:</span>
                            <ul>
                              <li>Sinpe Móvil {localized.to} 7157-3637</li>
                              <li>CR60090100001970028841 ({localized.crcAccount})</li>
                              <li>CR33090100001970028842 ({localized.usdAccount})</li>
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
                      }
                    </div>
                  }

                  {action === 'BILLPAY' &&
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
                  }
                </div>
              }

              <div className="submit-container mb-3">
                <button id="submit-btn" type="submit" className="btn btn-primary" disabled={loading || disableButton} onClick={handleFormSubmit}>{localized.submitBtnTitle}</button>
                {loading &&
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                }
              </div>
            </div>
          }
        </form>
      }

      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        localized={localized}
        invoice={invoice} />

    </div>
  )
}

export default Main;
