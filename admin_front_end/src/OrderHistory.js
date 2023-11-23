import 'react-data-grid/lib/styles.css'

import { useState, useEffect, useMemo, createContext, useContext } from 'react'
import DataGrid from 'react-data-grid'
import { Tooltip } from 'react-tooltip'
import * as csv from 'csv/browser/esm/sync'

import { getApiKey, inputStopPropagation } from './utils/index'
import FilterRenderer from './FilterRenderer'
import TextEditor from './textEditor'

function OrderHistory({}) {
  const today = new Date()
  today.setUTCHours(23,59,59,999)

  const defaultFromDate = new Date()
  defaultFromDate.setUTCHours(0,0,0,0)
  defaultFromDate.setDate(today.getDate() - 7)

  const [apiKey, setApiKey] = useState(getApiKey())
  const [orders, setOrders] = useState({})
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [from, setFrom] = useState(defaultFromDate)
  const [to, setTo] = useState(today)
  const [filters, setFilters] = useState({
    timestamp: '',
    status: '',
    paymentStatus: '',
    settlementData: '',
    Type: '',
    "From Amount": '',
    "From Currency": '',
    "To Amount": '',
    "To Currency": '',
    "Payment Type": '',
    "Payment Identifier": '',
    "Payment Destination": '',
    User: '',
    "Payment Description": '',
  })

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
    if(!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      getOrders()
    }
  }, [from, to])

  const columns = useMemo(() => {
    if(!orders.length) {
      return []
    }

    return Object.keys(orders[0]).map((value) => {
      const obj = {
        key: value,
        name: value,
        resizable: true,
        headerCellClass: "filter-column",
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
        renderHeaderCell(p) {
          const col = p.column.key

          if(typeof filters[col] === 'undefined') {
            return (
              <div>{p.column.name}</div>
            )
          }

          return (
            <FilterRenderer {...p}>
              {({ ...rest }) => (
                <input
                  {...rest}
                  className="filterInput"
                  value={filters[col] ?? filters[col]}
                  placeholder="Search..."
                  onChange={(e) => {
                    const newObj = {...filters}
                    newObj[col] = e.target.value.toString()
                    setFilters(newObj)
                  }}
                  onKeyDown={inputStopPropagation}
                />
              )}
            </FilterRenderer>
          )
        }
      }

      if(['Payment Identifier', 'Payment Destination', 'From Amount', 'To Amount', 'From Currency', 'To Currency', 'Payment Description'].indexOf(obj.key) !== -1) {
        obj.renderEditCell = TextEditor
      }

      return obj

    })
  })

  columns.unshift({
    key: "Actions",
    name: "Actions",
    resizable: true,
    headerCellClass: "filter-column",
    renderCell(props) {
      return (
        <div>
          {props.row.paymentStatus !== 'complete' &&
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => processOrder(props.row)} 
              disabled={actionLoading}>
                {actionLoading &&
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                }
                {!actionLoading &&
                  <span>Pay</span>
                }
            </button>
          }
        </div>
      )
    }
  })

  const handleEditRows = (rows, change) => {
    const field = change.column.key
    const row = rows[change.indexes[0]]
    const timestamp = row.timestamp
    const newVal = row[field]
    const data = {}
    data[field] = newVal

    fetch('/editOrder', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey,
        timestamp,
        data,
      })
    })
    .then(res => res.json())
    .then(res => {
      if(res.error) {
        alert(res.message)
      }
    })
    .then(getOrders)
  }

  const filteredRows = useMemo(() => {
    let hasFilter = false
    Object.values(filters).forEach((val) => {
      if(val.length) {
        hasFilter = true
      }
    })

    if(!hasFilter) {
      return orders
    }

    const filterKeys = Object.keys(filters)

    return orders.filter((order) => {

      let include = false

      for (let i = 0; i < filterKeys.length; i++) { 
        const key = filterKeys[i]
        const filterVal = filters[key]

        if(order[key] && filterVal.length && order[key].toString().indexOf(filterVal) !== -1) {
          include = true
        }
      }

      return include
    })
  }, [orders, filters])

  const processOrder = (row, force) => {
    setActionLoading(true)

    let url = ''
    if(row.Type === 'Buy') {
      url += '/payInvoice/?'
    } else {
      url += '/payFiat/?'
    }

    url += new URLSearchParams({timestamp: row.timestamp, apiKey: apiKey, force: (force ? "true" : "")}).toString()

    fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message || "An unexpected error has occurred")

        if(!force) {
          const conf = window.confirm("Do you want to force pay this order?")

          if(conf) {
            processOrder(row, true)
          }
        }

        return
      }

      alert("Success!")
    })
    .catch((e) => {
      alert('error settling order')
      return
    })
    .finally(() => {
      setActionLoading(false)
      getOrders()
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
    let myCols = [...columns]
    myCols.shift()
    const output = csv.stringify([
      myCols.map((col) => col.key),
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
                {loading &&
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                }
                <button className="btn btn-primary from-control" onClick={() => exportCSV() }>
                  Export CSV
                </button>
              </div>
            </div>
          </div> 
          {orders.length > 0 &&
            <div>
              <div className="mb-3">
                <DataGrid 
                  style={{height: "80vh"}}
                  columns={columns}
                  headerRowHeight={70}
                  rows={filteredRows}
                  onRowsChange={handleEditRows}
                  onCellClick={(args, event) => {
                    if (args.column.key === 'id') {
                      event.preventGridDefault();
                      args.selectCell(true);
                    }
                  }} />
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  )
}

export default OrderHistory