import { useState } from 'react'
import { getApiKey } from './utils/index'

function SendToSelva() {
  const [apiKey] = useState(getApiKey())
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('CRC')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/sendToSelva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          apiKey,
          amount,
          currency
        })
      })

      const data = await response.json()
      
      if (data.error) {
        setError(data.message || data.type || 'An error occurred')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Network error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col">
          <h4 className="mb-4">Send to Selva</h4>
          
          {error && (
            <div className="alert alert-danger mb-3">
              {error}
            </div>
          )}
          
          {result && result.success && (
            <div className="alert alert-success mb-3">
              Transfer sent successfully!
              {result.data && result.data.send && (
                <div className="mt-2">
                  <p>Reference Number: {result.data.send[1].referenceNumber}</p>
                </div>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="amount" className="form-label">Amount</label>
              <input
                type="text"
                className="form-control"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={loading}
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="currency" className="form-label">Currency</label>
              <select
                className="form-select"
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={loading}
              >
                <option value="CRC">CRC</option>
                <option value="USD">USD</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Send to Selva'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SendToSelva 