import { useState, useEffect } from 'react'
import { Link } from "react-router-dom"

import { getApiKey } from './utils/index'

function Home() {
  const [apiKey, setApiKey] = useState(getApiKey())
  const [systemAlert, setSystemAlert] = useState({active: false})
  const [loading, setLoading] = useState(false)

  const getAlert = async () => {
    fetch("/alert")
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        console.log('error getting alert')
        return
      }

      setSystemAlert(data.data)
    })
    .catch((e) => {
      console.log('error getting alert', e)
    })
  }

  const updateAlert = (e) => {
    e.preventDefault()
    const message = prompt("Enter updated system status here. Leave blank to deactivate message.")

    setLoading(true)

    fetch("/alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        active: (message && message.length ? true : false),
        message: (message && message.length ? message : null),
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

  return (
    <div className="container">
      <div className="row">
        <div className="col">
          {systemAlert.active == true &&
            <div className="container text-center mb-3">
              <div className="alert alert-danger">
                🚨<b>System Status Update</b>🚨
                <br />{new Date(systemAlert.timestamp).toLocaleString()}
                <br />{systemAlert.message}
              </div>
            </div>
          }
        </div>
      </div>
      <div className="row">
        <div className="col">
          <ul className="list-group">
            <li className="list-group-item">
              <Link to="bankAccounts">Bank Accounts</Link>
            </li>
            <li className="list-group-item">
              <Link to="orderHistory">Order History</Link>
            </li>
            <li className="list-group-item">
              <Link to="phoneNumbers">Phone Numbers</Link>
            </li>
            <li className="list-group-item">
              <Link to="createOrder">Manually Create Order</Link>
            </li>
            <li className="list-group-item">
              <Link to="stats">Order Stats</Link>
            </li>
            <li className="list-group-item">
              <Link to="manageCurrencies">Manage Currencies</Link>
            </li>
            <li className="list-group-item">
              <Link to="sendToSelva">Send to Selva</Link>
            </li>
            <li className="list-group-item">
              <a onClick={updateAlert} href="#">Update System Status</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;
