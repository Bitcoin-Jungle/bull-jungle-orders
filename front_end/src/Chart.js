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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
  },
}

function Chart({ localized, language, apiKey }) {
  const [data, setData] = useState([])

  const getData = () => {
    fetch(`/priceHistory?apiKey=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message || "An unexpected error has occurred.")
        return
      }

      setData(data.data.reverse())
    })
  }

  useEffect(() => {
    getData()
  }, [])

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
      <div className="spinner-border" role="status" style={{width: "1rem", height: "1rem"}}>
        <span className="visually-hidden">Loading...</span>
      </div>
    )
  }

  return (
    <div className="well" style={{backgroundColor: "white"}}>
      <Line 
        data={lineData}
        options={options}
      />
    </div>
  )
}

export default Chart