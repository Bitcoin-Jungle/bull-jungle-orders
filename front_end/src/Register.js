import { useState } from 'react'

import localizeText from './lang/index'

import Rules from './Rules'

import { getApiKey, getUsername, getLanguage, getPhoneNumber } from './utils/index'

function Register({ clearForm }) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const username = getUsername()
  const phoneNumber = getPhoneNumber()

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
        bitcoinJungleUsername: username,
        phoneNumber,
      })
    })
    .then((res) => res.json())
    .then((data) => {
      if(data.success) {
        setSubmitted(true)
      } else if(data.type) {
        if(data.type === 'approved') {
          const url = new URL(window.location.href)
          url.searchParams.delete('registered')

          console.log(url)

          window.location = url
        } else {
          alert(localized.errors[data.type] || "An unknown error has occurred")
        }
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
        <img src="/bull-bitcoin-banner-logo.png" className="bull-logo small" />
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
              {!submitted && username &&
                <button className="btn btn-primary text-light align-middle" onClick={handleClick} disabled={loading}>
                  {loading &&
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  }
                  {localized.registerBtn}
                </button>
              }
              {submitted &&
                <div>
                  <div className="alert alert-success">
                    {localized.registerSuccess}
                  </div>
                  <Rules 
                    localized={localized} />
                </div>
              }
              <button className="btn btn-secondary text-light align-middle mt-5" onClick={clearForm} disabled={loading}>
                Go Back
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register