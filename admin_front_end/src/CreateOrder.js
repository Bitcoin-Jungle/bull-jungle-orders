import { useState, useEffect } from 'react'

const fields = [
  {
    name: "timestamp", 
    helper: "This is the YYYY-MM-DDTHH:MM:SS.MMMZ timestamp found on the invoice label",
  },
  {
    name: "fiatAmount", 
    helper: "Enter the amount of fiat, up to 2 decimal places. Format XXXX.YY",
  },
  {
    name: "fiatCurrency", 
    helper: "Enter USD or CRC only.",
  },
  {
    name: "satAmount", 
    helper: "This is the amount in satoshis for the order."
  },
  {
    name: "action", 
    helper: "Enter BUY or SELL only.",
  },
  {
    name: "paymentReq",
    helper: "For SELL orders this is the destination SINPE Movil number or IBAN Account Number. For BUY orders, this is the bolt11 invoice to pay the customer their bitcoin.",
  },
  {
    name: "paymentDesc",
    helper: "For SELL orders, this is the message included with the fiat payment to the bank. Do not enter anything for BUY orders.",
  },
  {
    name: "phoneNumber", 
    helper: "This is the phone number of the user making the order (not the destination). Enter format +506xxxxxxxx (+, then country code, then phone number, no spaces or dashes)",
  },
  {
    name: "username",
    helper: "This is the user's bitcoin jungle username. It should match the phoneNumber in the wallet.",
  },
  {
    name: "invoice",
    helper: "For SELL orders, this is the bolt11 of the invoice the customer paid to us. Leave blank for BUY orders.",
  },
  {
    name: "paymentHash", 
    helper: "For SELL orders, this is the payment_hash of the invoice the customer paid to us. Leave blank for BUY orders.",
  },
  {
    name: "paymentIdentifier",
    helper: "For BUY orders, this is the 25 digit payment reference number provided by their bank. Leave blank for SELL orders.",
  },
]

function CreateOrder({}) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)

  const apiKey = "E4WE5GgDr6g8HFyS4K4m5rdJ"

  const setDataField = (field, value) => {
    const newData = {
      ...data
    }

    newData[field] = value

    setData(newData)

    if(field === 'timestamp' && value !== '') {
      fetchInvoice(value)
    }
  }

  const fetchInvoice = async (timestamp) => {
    let url = "/invoice/?"

    url += new URLSearchParams({timestamp, apiKey}).toString()

    fetch(url)
    .then((res) => res.json())
    .then((invoiceData) => {
      if(invoiceData.error) {
        alert(invoiceData.type || invoiceData.message || "An unexpected error has occurred")

        return
      }

      const invoice = invoiceData.data
      const newData = {
        ...data,
        timestamp,
      }

      if(invoice) {
        newData.action = 'SELL'
        newData.invoice = invoice.bolt11
        newData.paymentHash = invoice.payment_hash
        newData.satAmount = Math.round(invoice.msatoshi / 1000).toString()

        const matches = invoice.description.matchAll(/(.*) (.*) to (.*) (.*)/g)

        for (const match of matches) {
          if(match.length === 5) {
            newData.fiatAmount = match[1]
            newData.fiatCurrency = match[2]
            newData.paymentReq = match[3]
            newData.paymentDesc = match[4]
          }
        }

        setData(newData)

      }
    })
  }

  const submitOrder = async () => {
    if(loading) {
      return
    }

    setLoading(true)

    return fetch("/order", {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json; charset=utf-8"
      },
      "body": JSON.stringify({
        ...data,
        apiKey,
      })
    })
    .then((res) => res.json())
    .then((data) => {
      setLoading(false)

      if(data.error) {
        alert(`Error: ${data.type || data.message}`)
        return
      } else {
        alert("Order completed successfully")

        setData({})
      }
    })
  }

  return (
    <div className="container">
      <form id="addOrder" onSubmit={(e) => e.preventDefault()}>
        {fields.map((field) => {
          return (
            <div className="row">
              <div className="col-12">
                <div className="mb-3">
                  <label htmlFor={field.name} className="form-label">{field.name}</label>
                  <input className="form-control" id={field.name} name={field.name} value={data[field.name] || ""} onChange={(e) => { setDataField(field.name, e.target.value) } }/>
                  <div className="form-text">{field.helper}</div>
                </div>
              </div>
            </div>
          )
        })}

        <div className="well">
          <div className="submit-container mb-1 mt-1">
            <button id="submit-btn" type="submit" className="btn btn-primary" disabled={loading} onClick={submitOrder}>Create Order</button>
            {loading &&
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            }
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateOrder