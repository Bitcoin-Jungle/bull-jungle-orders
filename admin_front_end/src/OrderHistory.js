import 'react-data-grid/lib/styles.css'

import { useState, useEffect } from 'react'
import DataGrid from 'react-data-grid'
import { Tooltip } from 'react-tooltip'
import * as csv from 'csv/browser/esm/sync'

import { getApiKey } from './utils/index'

function OrderHistory({}) {
  const today = new Date()
  today.setUTCHours(23,59,59,999)

  const defaultFromDate = new Date()
  defaultFromDate.setUTCHours(0,0,0,0)
  defaultFromDate.setDate(today.getDate() - 7)

  const [apiKey, setApiKey] = useState(getApiKey())
  const [orders, setOrders] = useState({})
  const [loading, setLoading] = useState(false)
  const [from, setFrom] = useState(defaultFromDate)
  const [to, setTo] = useState(today)

  const getOrders = () => {
    if(loading) {
      return 
    }

    setLoading(true)

    fetch(`/getOrders?apiKey=${apiKey}&from=${from.toISOString()}&to=${to.toISOString()}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message)
        return
      }

      const output = data.data.map((el) => {
        const newObj = JSON.parse(el.data)
        delete el.data
        delete el.id
        delete newObj.Date

        return {
          ...el,
          ...newObj,
        }
      })

      setOrders(output)
    })
    .catch((e) => {
      alert("ERROR")
    })
    .finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    getOrders()
  }, [])

  useEffect(() => {
    if(!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      getOrders()
    }
  }, [from, to])

  let columns = []

  if(orders.length > 0) {
    columns = Object.keys(orders[0]).map((value) => {
      return {
        key: value,
        name: value,
        resizable: true,
        renderCell(props) {
          let cell = props.row[props.column.key]
          const id = (Math.random() + 1).toString(36).substring(7)

          if(
            (props.column.key === 'From Amount' && props.row['Type'] == 'Sell') ||
            (props.column.key === 'To Amount' && props.row['Type'] == 'Buy')
          ) {
            cell = eval(cell.replace('=', ''))
          }

          return (
            <>
              <span id={`cell-${id}`}>{cell}</span>
              <Tooltip 
                anchorSelect={`#cell-${id}`} 
                place="bottom" 
                content={cell} 
                positionStrategy="fixed" 
                style={{zIndex: 1000}} 
                className="unselectable"
                render={() => {
                  return (
                    <span className="unselectable">{cell}</span>
                  )
                }}
              />
            </>
          )
        },
      }
    })
  }

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
      columns.map((col) => col.key),
      ...orders.map((order) => Object.values(order)),
    ])

    let blobx = new Blob([output], { type: 'text/csv' }); // ! Blob
    let elemx = window.document.createElement('a');
    elemx.href = window.URL.createObjectURL(blobx); // ! createObjectURL
    elemx.download = "orderHistory.csv";
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
          {!loading && orders.length > 0 &&
            <div>
              <div className="mb-3">
                <DataGrid 
                  style={{height: "80vh"}}
                  columns={columns}
                  rows={orders} />
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  )
}

export default OrderHistory