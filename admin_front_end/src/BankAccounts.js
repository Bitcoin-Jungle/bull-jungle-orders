import 'react-data-grid/lib/styles.css'

import { useState, useEffect } from 'react'
import DataGrid from 'react-data-grid'
import { Tooltip } from 'react-tooltip'
import * as csv from 'csv/browser/esm/sync'

import { getApiKey } from './utils/index'

function BankAccounts({}) {
  const today = new Date()
  today.setUTCHours(23,59,59,999)

  const defaultFromDate = new Date()
  defaultFromDate.setUTCHours(0,0,0,0)
  defaultFromDate.setDate(today.getDate() - 7)

  const [apiKey, setApiKey] = useState(getApiKey())
  const [account, setAccount] = useState("")
  const [accounts, setAccounts] = useState({})
  const [accountDetail, setAccountDetail] = useState({})
  const [loading, setLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [from, setFrom] = useState(defaultFromDate)
  const [to, setTo] = useState(today)

  const getAccounts = () => {
    setLoading(true)
    fetch(`/getAccounts?apiKey=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message)
        return
      }

      setAccounts(data.data)
    })
    .catch((e) => {
      alert("ERROR")
    })
    .finally(() => {
      setLoading(false)
    })
  }

  const getHistory = () => {
    if(!account.iban) {
      return
    }

    setLoading(true)

    const params = new URLSearchParams({
      apiKey,
      from: from.toISOString(),
      to: to.toISOString(),
      page: pageNumber,
      iban: account.iban,
    })

    fetch(`/getHistory?${params}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        if(!data.transfers.length) {
          alert("No transactions found.")
          return
        }

        alert(data.message || "An unexpected error has occurred.")
        return
      }

      let output = data
      output.transfers = data.transfers.map((el) => {
        return {
          ...el,
          sinpeMovil: JSON.stringify(el.sinpeMovil)
        }
      })

      setAccountDetail(data)
    })
    .catch((e) => {
      alert("ERROR")
    })
    .finally(() => {
      setLoading(false)
    })
  }

  const handleAccountChange = (e) => {
    const value = e.target.value

    setAccount(accounts[value])
    setAccountDetail({})
    setPageNumber(1)
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
      ...accountDetail.transfers.map((order) => Object.values(order)),
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

  const handleEditRow = (rows, data) => {
    for (var i = data.indexes.length - 1; i >= 0; i--) {
      const index = data.indexes[i]
      const row = rows[index]

      console.log(JSON.parse(row.originalObj))
    }
  }

  useEffect(() => {
    getAccounts()
  }, [])

  useEffect(() => {
    getHistory()
    // setInterval(getHistory, 1000 * 30)
  }, [account, pageNumber])

  useEffect(() => {
    if(!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      getHistory()
    }
  }, [from, to])

  let columns = []

  if(accountDetail && accountDetail.transfers && accountDetail.transfers.length > 0) {
    columns = Object.keys(accountDetail.transfers[0]).map((value) => {
      return {
        key: value,
        name: value,
        resizable: true,
        renderCell(props) {
          const cell = props.row[props.column.key]
          const id = (Math.random() + 1).toString(36).substring(7)

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

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col">
          <div className="mb-3">
            <select onChange={handleAccountChange} value={(account ? account.data.account.Currency : null)}>
              <option>-- Select an Account --</option>
              {accounts.CRC &&
                <option value={"CRC"}>
                  CRC - {accounts.CRC.data.account.Balance}
                </option>
              }
              {accounts.USD &&
                <option value={"USD"}>
                  USD - {accounts.USD.data.account.Balance}
                </option>
              }
            </select>

            {loading &&
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            }
          </div>
        </div>
      </div>

      {account && 
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
          </div>
        </div>
      }

      {accountDetail && accountDetail.transfers && accountDetail.transfers.length > 0 &&
        <div>
          <div className="row">
            <div className="col">
              <div className="mb-3">
                <DataGrid 
                  style={{height: "80vh"}}
                  columns={columns}
                  rows={accountDetail.transfers} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <div className="mb-3">
                {pageNumber > 1 &&
                  <button className="btn btn-primary" onClick={() => setPageNumber(pageNumber - 1) } disabled={loading}>
                    Previous Page
                  </button>
                }
                {accountDetail.nextPage &&
                  <button className="btn btn-primary" onClick={() => setPageNumber(pageNumber + 1) } disabled={loading}>
                    Next Page
                  </button>
                }
              </div> 
            </div>
          </div>
        </div>
      }
    </div>
  )
}

export default BankAccounts