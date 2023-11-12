import { useState, useEffect } from 'react'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from "react-chartjs-2"
import zoomPlugin from 'chartjs-plugin-zoom'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  zoomPlugin
)

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    zoom: {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'xy',
      }
    }
  }
}

function Chart({ localized, language, apiKey }) {
  const [data, setData] = useState([])
  const [fiatCurrency, setFiatCurrency] = useState("CRC")
  const [loaded, setLoaded] = useState(false)

  const getData = () => {
    fetch(`/priceHistory?apiKey=${apiKey}&fiatCurrency=${fiatCurrency}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(localized.errors[data.type] || data.message || "An unexpected error has occurred.")
        return
      }

      setData(data.data.reverse())
      setTimeout(() => {
        setLoaded(true)
      }, 750)
    })
  }

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {
    setData([])
    getData()
  }, [fiatCurrency])

  const labels = data.map((el) => {
    const dateOptions = { weekday: undefined, year: undefined, month: 'short', day: 'numeric', hour: '2-digit', hour12: true }
    const date = new Date(el.date)
    return date.toLocaleDateString(language, dateOptions)
  })

  const lineData = {
    labels,
    datasets: [
      {
        label: localized.buy,
        data: data.map((el) => el.buy),
        borderColor: '#459C0B',
        backgroundColor: '#459C0B',
      },
      {
        label: localized.index,
        data: data.map((el => el.index)),
        borderColor: '#000000',
        backgroundColor: '#000000',
      },
      {
        label: localized.sell,
        data: data.map((el) => el.sell),
        borderColor: '#FF7e1c',
        backgroundColor: '#FF7e1c',
      },
    ],
  }

  if(data.length === 0) {
    return (
      <div>Loading...</div>
    )
  }

  return (
    <div className={loaded ? "loaded" : ""} style={{backgroundColor: "white"}}>
      <select value={fiatCurrency} onChange={(e) => setFiatCurrency(e.target.value)}>
        <option value="CRC">{localized.crc}</option>
        <option value="USD">{localized.usd}</option>
      </select>
      <Line 
        data={lineData}
        options={options}
      />
    </div>
  )
}

export default Chart