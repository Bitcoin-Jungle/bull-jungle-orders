import { useState } from 'react'

import localizeText from './lang/index'

import { getApiKey, getUsername, getLanguage } from './utils/index'

function Register() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const localized = localizeText(getLanguage())

  const handleClick = (e) => {
    e.preventDefault()

    setLoading(true)

    fetch("/addUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        apiKey: getApiKey(),
        bitcoinJungleUsername: getUsername(),
      })
    })
    .then((res) => res.json())
    .then((data) => {
      if(data.success) {
        setSubmitted(true)
      } else {
        alert(data.message || "An unknown error has occurred")
      }
    })
    .finally(() => {
      setLoading(false)
    })
  }

  return (
    <div>
      <div className="text-center mt-3 mb-3">
        <img src="/bull-bitcoin-banner-logo.png" className="bull-logo" />
      </div>
      <div className="container d-flex">
        <form id="addOrder" className="d-flex flex-grow-1 justify-content-center align-items-center" onSubmit={(e) => e.preventDefault()}>
          <div className="row action-buttons mb-3">
            <div className="col-12">
              <h3>{localized.registerTitle}</h3>
              <p>{localized.registerSubtext1}</p>
              <p>{localized.registerSubtext2}</p>
            </div>
            <div className="col-12">
              {!submitted &&
                <button className="btn btn-secondary text-light align-middle" onClick={handleClick} disabled={loading}>
                  {loading &&
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  }
                  {localized.registerBtn}
                </button>
              }
              {submitted &&
                <div className="alert alert-success">
                  {localized.registerSuccess}
                </div>
              }
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register