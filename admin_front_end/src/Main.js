import 'react-data-grid/lib/styles.css'

import { useState, useEffect } from 'react'
import DataGrid from 'react-data-grid'
import * as moment from 'moment'

import { getApiKey } from './utils/index'

function Main({}) {
  const [apiKey, setApiKey] = useState(getApiKey())
  const [account, setAccount] = useState("")
  const [accounts, setAccounts] = useState({})
  const [accountDetail, setAccountDetail] = useState({})
  const [loading, setLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)

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
      from: moment().subtract(2, 'days').format('YYYY-MM-DD'),
      to: moment().format('YYYY-MM-DD'),
      page: pageNumber,
      iban: account.iban,
    })

    fetch(`/getHistory?${params}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message)
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

  useEffect(() => {
    getAccounts()
  }, [])

  useEffect(() => {
    getHistory()
  }, [account, pageNumber])

  let columns = []

  if(accountDetail && accountDetail.transfers && accountDetail.transfers.length > 0) {
    columns = Object.keys(accountDetail.transfers[0]).map((value) => {
      return {
        key: value,
        name: value,
      }
    })
  }

  return (
    <div>
      <h3>Bull Jungle Admin</h3>

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

      {accountDetail && accountDetail.transfers && accountDetail.transfers.length > 0 &&
        <div>
          <DataGrid 
            style={{height: "80vh"}}
            columns={columns}
            rows={accountDetail.transfers} />

          {accountDetail.nextPage &&
            <div>
              <button className="btn btn-primary" onClick={() => setPageNumber(pageNumber + 1) }>
                Next Page
              </button>
            </div> 
          }
        </div>
      }

    </div>
  )
}

  export default Main