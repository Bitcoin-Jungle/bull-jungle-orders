import './App.css'

import { useState, useEffect } from 'react'
import { QRCode } from "react-qrcode-logo"
import {
  gql,
  useQuery,
  useMutation,
  useSubscription,
} from "@apollo/client"

const RECIPIENT_WALLET_ID = gql`
  query userDefaultWalletId($username: Username!) {
    recipientWalletId: userDefaultWalletId(username: $username)
  }
`

const LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT = gql`
  mutation lnInvoiceCreateOnBehalfOfRecipient($walletId: WalletId!, $amount: SatAmount!) {
    mutationData: lnInvoiceCreateOnBehalfOfRecipient(
      input: { recipientWalletId: $walletId, amount: $amount }
    ) {
      errors {
        message
      }
      invoice {
        paymentRequest
      }
    }
  }
`

const LN_INVOICE_PAYMENT_STATUS = gql`
  subscription lnInvoicePaymentStatus($input: LnInvoicePaymentStatusInput!) {
    lnInvoicePaymentStatus(input: $input) {
      errors {
        message
      }
      status
    }
  }
`

function Main({ client }) {
  const [loading, setLoading] = useState(false)

  const [priceData, setPriceData] = useState({})

  const [apiKey, setApiKey] = useState("")
  const [fiatAmount, setFiatAmount] = useState("")
  const [fiatCurrency, setFiatCurrency] = useState("")
  const [satAmount, setSatAmount] = useState("")
  const [action, setAction] = useState("")
  const [paymentReq, setPaymentReq] = useState("")
  const [billerCategory, setBillerCategory] = useState("")
  const [billerService, setBillerService] = useState("")
  const [billerActionType, setBillerActionType] = useState("")
  const [billerAccountNumber, setBillerAccountNumber] = useState("")
  const [invoice, setInvoice] = useState("")
  const [showModal, setShowModal] = useState(false)

  const { data: recipientData } = useQuery(RECIPIENT_WALLET_ID, {
    variables: {
      username: "lee2",
    },
  })

  const { recipientWalletId } = recipientData || {recipientWalletId: null}

  const loadInvoice = (data) => {
    setInvoice(data.mutationData.invoice.paymentRequest)
    setShowModal(true)
    setLoading(false)
  }

  const loadUserInvoice = (data) => {
    console.log(data)
    setPaymentReq(data.mutationData.invoice.paymentRequest)
  }

  const [createInvoice] = useMutation(LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT, {
    onError: () => setLoading(false),
    onCompleted: loadInvoice,
  })

  const [createUserInvoice] = useMutation(LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT, {
    onError: () => setLoading(false),
    onCompleted: loadUserInvoice,
  })

  useSubscription(LN_INVOICE_PAYMENT_STATUS, {
    variables: {
      input: {
        paymentRequest: invoice,
      },
    },
    onData: ({ data }) => {
      if (data.data.lnInvoicePaymentStatus.status === "PAID") {
        setShowModal(false)
        submitOrder()
      }
    },
  })

  const fetchInvoice = () => {
    setLoading(true)
    createInvoice({
      variables: { walletId: recipientWalletId, amount: satAmount },
    })
  }

  const generateUserInvoice = async () => {
    const username = prompt("What is your Bitcoin Jungle Username?")

    const response = await client.query({
      query: RECIPIENT_WALLET_ID,
      variables: {
        username,
      },
    })

    createUserInvoice({
      variables: { walletId: response.data.recipientWalletId, amount: satAmount },
    })
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

  const getApiKey = () => {
    const params = (new URL(document.location)).searchParams;
    const key = params.get("key");

    if(key && key.length > 0) {
      setApiKey(key)
    }
  }

  const clearForm = () => {
    setFiatAmount("")
    setFiatCurrency("")
    setSatAmount("")
    setAction("")
    setPaymentReq("")
    setBillerCategory("")
    setBillerService("")
    setBillerActionType("")
    setBillerAccountNumber("")
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
    setInterval(getPriceData, 1000 * 30)

    getApiKey()
  }, [])

  useEffect(() => {
    const calculateSatAmount = () => {
      if(!fiatAmount || !fiatCurrency || priceData.error) {
        return
      }

      const satAmount = parseFloat(fiatAmount) / parseFloat(priceData[`BTC${fiatCurrency}`]) * 100000000
      setSatAmount(""+Math.round(satAmount))
    }

    calculateSatAmount()
  }, [fiatAmount, fiatCurrency, priceData])

  useEffect(() => {
    if(showModal) {
      document.querySelector('body').classList.add('modal-open')
    } else {
      document.querySelector('body').classList.remove('modal-open')
    }
  }, [showModal])

  return (
    <div className="container">
      <h1>New Order For Bull Jungle</h1>
      <form id="addOrder" onSubmit={(e) => e.preventDefault()}>
        <div className="mb-3">
          <label htmlFor="apiKey" className="form-label">API Key</label>
          <input type="password" className="form-control" id="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          <div className="form-text">Enter your API Key here</div>
        </div>

        {apiKey && 
          <div>

            <div className="row action-buttons">
              <div className="mb-3">
                <label htmlFor="fiatAmount" className="form-label">Action</label>
              </div>
              <div className="col">
                <button className={(action === "BUY" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => setAction("BUY")}>Buy BTC</button>
              </div>
              <div className="col">
                <button className={(action === "SELL" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => setAction("SELL")}>Sell BTC</button>
              </div>
              <div className="col">
                <button className={(action === "BILLPAY" ? "btn btn-primary" : "btn btn-secondary")} onClick={() => setAction("BILLPAY")}>Bill Pay</button>
              </div>
              <div className="mb-3">
                <div className="form-text">Select the action you wish to perform above</div>
              </div>
            </div>

            {action && 
              <div>

                <div className="row">
                  <div className="col">
                    <label htmlFor="fiatAmount" className="form-label">Fiat Amount</label>
                    <input type="text" className="form-control" id="fiatAmount" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} />
                    <div className="form-text">Enter the amount in fiat</div>
                  </div>

                  <div className="col">
                    <label htmlFor="fiatCurrency" className="form-label">Fiat Currency</label>
                    <select className="form-control" id="fiatCurrency" value={fiatCurrency} onChange={(e) => setFiatCurrency(e.target.value)}>
                      <option value="">-- Select an Option --</option>
                      <option value="CRC">CRC</option>
                      <option value="USD">USD</option>
                    </select>
                    <div className="form-text">Enter the desired fiat currency</div>
                  </div>

                  <div className="col">
                    <label htmlFor="satAmount" className="form-label">Sat Amount</label>
                    <input type="text" className="form-control" id="satAmount" value={satAmount} onChange={(e) => setSatAmount(e.target.value)} />
                    <div className="form-text">Enter the amount of satoshis here. Exchange rate is updated as of <span style={{fontWeight: "bold"}} id="price-timestamp">{priceData.timestamp || priceData.message}</span></div>
                  </div>

                </div>

                {fiatAmount && fiatCurrency && satAmount &&
                  <div>
                    {action === 'SELL' &&
                      <div className="paymentReqContainer">
                        <div className="mb-3">
                          <label htmlFor="paymentReq" className="form-label">Payment Destination</label>
                          <input className="form-control" id="paymentReq" value={paymentReq} onChange={(e) => setPaymentReq(e.target.value)} />
                          <div className="form-text">Enter the SINPE Movil phone number you want to receive payment at.</div>
                        </div>
                      </div>
                    }

                    {action === 'BUY' &&
                      <div className="paymentReqContainer">
                        <div className="mb-3">
                          <label htmlFor="paymentReq" className="form-label">Payment Destination</label>
                          <div className="bj-wallet">
                            <p><b>Have Bitcoin Jungle Wallet? <button className="btn btn-primary btn-sm" onClick={generateUserInvoice}>Click here</button> to automatically generate an invoice for your wallet.</b></p>
                          </div>
                          <textarea className="form-control" id="paymentReq" value={paymentReq} onChange={(e) => setPaymentReq(e.target.value)}></textarea>
                          <div className="form-text">
                            Enter a lightning invoice where you want to receive the bitcoin.                        
                          </div>
                        </div>
                      </div>
                    }

                    {action === 'BILLPAY' &&
                      <div className="billPayContainer">
                        <div className="mb-3">
                          <label htmlFor="billerCategory" className="form-label">Biller Category</label>
                          <input type="text" className="form-control" id="billerCategory" value={billerCategory} onChange={(e) => setBillerCategory(e.target.value)} />
                        </div>

                        <div className="mb-3">
                          <label htmlFor="billerService" className="form-label">Biller Service</label>
                          <input type="text" className="form-control" id="billerService" value={billerService} onChange={(e) => setBillerService(e.target.value)} />
                        </div>

                        <div className="mb-3">
                          <label htmlFor="billerActionType" className="form-label">Biller Action Type</label>
                          <input type="text" className="form-control" id="billerActionType" value={billerActionType} onChange={(e) => setBillerActionType(e.target.value)} />
                        </div>

                        <div className="mb-3">
                          <label htmlFor="billerAccountNumber" className="form-label">Biller Account Number</label>
                          <input type="text" className="form-control" id="billerAccountNumber" value={billerAccountNumber} onChange={(e) => setBillerAccountNumber(e.target.value)} />
                        </div>
                      </div>
                    }
                  </div>
                }

                <button id="submit-btn" type="submit" className="btn btn-primary" disabled={loading} onClick={handleFormSubmit}>Create Order Now</button>
                {loading &&
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                }
              </div>
            }
          </div>
        }
      </form>

      <div className="modal fade show" role="dialog" style={{display: (showModal ? "block" : "none")}} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Sell BTC</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Please scan or click on the QR code to pay.</p>
              <a href={`lightning:${invoice}`}>
                <QRCode
                  value={invoice}
                  size={320}
                  logoImage={"https://pay.bitcoinjungle.app/BJQRLogo.png"}
                  logoWidth={100}
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {showModal &&
        <div className="modal-backdrop fade show"></div>
      }

    </div>
  )
}

export default Main;
