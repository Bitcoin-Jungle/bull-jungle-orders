import { useState, useEffect } from 'react'
import * as csv from 'csv/browser/esm/sync'

import { getApiKey } from './utils/index'

function Stats({}) {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  firstDay.setUTCHours(0,0,0,0)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  lastDay.setUTCHours(23,59,59,999)

  const [apiKey, setApiKey] = useState(getApiKey())
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [from, setFrom] = useState(firstDay)
  const [to, setTo] = useState(lastDay)

  const getData = () => {
    if(loading) {
      return 
    }

    setLoading(true)

    fetch(`/stats?apiKey=${apiKey}&from=${from.toISOString()}&to=${to.toISOString()}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message)
        return
      }

      setData(data)
    })
    .catch((e) => {
      alert("ERROR")
    })
    .finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    if(!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      getData()
    }
  }, [from, to])

  const setDate = (type, dateStr) => {
    const date = new Date(dateStr)

    if(!isNaN(date.getTime())) {
      if(type == 'from') {
        date.setUTCHours(0,0,0,0)
        setFrom(date)
      } else if(type == 'to') {
        date.setUTCHours(23,59,59,999)
        setTo(date)
      }
    }
  }

  const exportCSV = () => {
    const output = csv.stringify([
      ["Stat", "Value"],
      ...Object.keys(data).map((key) => { 
        return [
          key,
          data[key],
        ] 
      }),
    ])

    let blobx = new Blob([output], { type: 'text/csv' }); // ! Blob
    let elemx = window.document.createElement('a');
    elemx.href = window.URL.createObjectURL(blobx); // ! createObjectURL
    elemx.download = "stats.csv";
    elemx.style.display = 'none';
    document.body.appendChild(elemx);
    elemx.click();
    document.body.removeChild(elemx);
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col">
          <div className="mb-3">
            <div className="row">
              <div className="col-4">
                <label htmlFor="from" className="form-label">From Date</label>
                <input type="date" className="form-control" defaultValue={from.toISOString().split('T')[0]} onBlur={(e) => setDate('from', e.target.value)} disabled={loading} />
              </div>
              <div className="col-4">
                <label htmlFor="to" className="form-label">To Date</label>
                <input type="date" className="form-control" defaultValue={to.toISOString().split('T')[0]} onBlur={(e) => setDate('to', e.target.value)} disabled={loading} />
              </div>
              <div className="col-4">
                <br />
                <button className="btn btn-primary from-control" onClick={() => exportCSV() }>
                  Export CSV
                </button>
              </div>
            </div>
          </div> 

          {loading &&
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          }
          {!loading && Object.keys(data).length > 0 &&
            <div>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Stat</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(data).map((key) => {
                    return (
                      <tr>
                        <td style={{textTransform: "capitalize"}}>{key.replaceAll("_", " ")}</td>
                        <td>{data[key]}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  )
}

export default Stats