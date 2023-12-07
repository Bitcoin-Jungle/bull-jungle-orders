import { useState, useEffect } from 'react'

import { getApiKey } from './utils/index'

function ManageCurrencies({}) {
  const [apiKey, setApiKey] = useState(getApiKey())
  const [currencyData, setCurrencyData] = useState({
    USD: {
      buy: false,
      sell: false,
    },
    CRC: {
      buy: false,
      sell: false,
    }
  })
  const [loading, setLoading] = useState(false)

  const getAlert = async () => {
    setLoading(true)

    fetch("/alert")
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        console.log('error getting alert')
        return
      }

      try {
        const types = JSON.parse(data.data.types)
        setCurrencyData(types)
      } catch {
        console.log(data.data.types)
        alert("error fetching data")
      }
    })
    .catch((e) => {
      console.log('error getting alert', e)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  const handleChange = (currency, type) => {
    const newData = {...currencyData}

    newData[currency][type] =  !newData[currency][type]

    setCurrencyData(newData)
    updateAlert()
  }

  const updateAlert = (e) => {
    fetch("/alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        types: currencyData,
        key: apiKey,
      }),
    })
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message)
        return
      }

      getAlert()
    })
    .catch((e) => {
      console.log('error updating alert', e)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    getAlert()
  }, [])

  console.log(currencyData)

  return (
    <div className="container">
      <table className="table table-responsive">
        <thead>
          <tr>
            <th>Currency</th>
            <th>Buy</th>
            <th>Sell</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              USD
            </td>
            <td>
              <input type="checkbox" checked={currencyData ? currencyData.USD.buy : false} onChange={() => handleChange("USD", "buy")} />
            </td>
            <td>
              <input type="checkbox" checked={currencyData ? currencyData.USD.sell : false} onChange={() => handleChange("USD", "sell")} />
            </td>
          </tr>
          <tr>
            <td>
              CRC
            </td>
            <td>
              <input type="checkbox" checked={currencyData ? currencyData.CRC.buy : false} onChange={() => handleChange("CRC", "buy")} />
            </td>
            <td>
              <input type="checkbox" checked={currencyData ? currencyData.CRC.sell : false} onChange={() => handleChange("CRC", "sell")} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default ManageCurrencies