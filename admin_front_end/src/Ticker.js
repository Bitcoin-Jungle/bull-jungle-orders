import { useState, useEffect } from "react"

function Ticker({}) {
  const [ticker, setTicker] = useState({})
  const [loading, setLoading] = useState(true)

  const getTicker = () => {
    setLoading(true)

    fetch("/ticker")
    .then((res) => res.json())
    .then((data) => {
      if(data.timestamp) {
        data.timestamp = new Date(data.timestamp).toLocaleString()
      }

      setTicker(data)
    })
    .catch((err) => {
      alert(err.toString())
      // setPriceData({error: true, message: err.toString()})
    })
    .finally(() => {
      setLoading(false)
    })
  }

  const formatNumber = (currency, number) => {
    return Number(number).toLocaleString(
      'en-US', 
      {
        currency: currency,
        style: "decimal",
        maximumFractionDigits: (currency == "CRC" ? 0 : 2),
        minimumFractionDigits: (currency == "CRC" ? 0 : 2),
      }
    )
  }

  useEffect(() => {
    getTicker()

    setInterval(getTicker, 30000)
  }, [])

  return (
    <marquee>
        {!loading && 
          <span>
            <b>BTCUSD</b> {formatNumber("USD", ticker.BTCUSD.toFromPrice)}
            <span className="mx-1"> | </span>
            <b>USDBTC</b> {formatNumber("USD", ticker.BTCUSD.fromToPrice)}
            <span className="mx-1"> | </span>
            <b>BTCCRC</b> {formatNumber("CRC", ticker.BTCCRC.toFromPrice)}
            <span className="mx-1"> | </span>
            <b>CRCBTC</b> {formatNumber("CRC", ticker.BTCCRC.fromToPrice)}
            <span className="mx-1"> | </span>
            <b>USDCRC</b> {formatNumber("USD", ticker.USDCRC.indexPrice)}
            <span className="mx-1"> | </span>
            <b>USDCAD</b> {formatNumber("CAD", ticker.USDCAD)}
            <span className="mx-1"> | </span>
            <b>Updated</b> {ticker.timestamp}
          </span>
        }
    </marquee>
  )
}

  export default Ticker