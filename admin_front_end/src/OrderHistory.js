import 'react-data-grid/lib/styles.css'

import { useState, useEffect } from 'react'
import DataGrid from 'react-data-grid'
import { Tooltip } from 'react-tooltip'
import * as moment from 'moment'
import * as csv from 'csv/browser/esm/sync'

import { getApiKey } from './utils/index'

function OrderHistory({}) {
  const [apiKey, setApiKey] = useState(getApiKey())
  const [orders, setOrders] = useState({})
  const [loading, setLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)

  const getOrders = () => {
    if(loading) {
      return 
    }

    setLoading(true)

    fetch(`/getOrders?apiKey=${apiKey}&page=${pageNumber}`)
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
    getOrders()
  }, [pageNumber])

  let columns = []

  if(orders.length > 0) {
    columns = Object.keys(orders[0]).map((value) => {
      return {
        key: value,
        name: value,
        resizable: true,
        renderCell(props) {
          const cell = props.row[props.column.key]
          const id = (Math.random() + 1).toString(36).substring(7)

          if(props.column.key === 'From Amount' && props.row['Type'] == 'Sell') {
            return (
              <span>{eval(cell.replace('=', ''))}</span>
            )
          }

          if(props.column.key === 'To Amount' && props.row['Type'] == 'Buy') {
            return (
              <span>{eval(cell.replace('=', ''))}</span>
            )
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
          {orders.length > 0 &&
            <div>
              <div className="mb-3">
                <DataGrid 
                  style={{height: "80vh"}}
                  columns={columns}
                  rows={orders} />
              </div>
            
              <div className="mb-3">
                {pageNumber > 1 &&
                  <button className="btn btn-primary" onClick={() => setPageNumber(pageNumber - 1) }>
                    Previous Page
                  </button>
                }

                <button className="btn btn-primary" onClick={() => exportCSV() }>
                  Export CSV
                </button>
                
              </div> 
            </div>
          }
        </div>
      </div>
    </div>
  )
}

export default OrderHistory