import { useEffect } from 'react'
import { QRCode } from "react-qrcode-logo"

function Modal({ showModal, setShowModal, invoice, localized }) {

  useEffect(() => {
    if(showModal) {
      document.querySelector('body').classList.add('modal-open')
    } else {
      document.querySelector('body').classList.remove('modal-open')
    }
  }, [showModal])

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(invoice)
      setTimeout(() => {
        alert("Invoice copied to clipboard")
      }, 750)
    } catch(e) {

    }
  }

  return (
    <>
      <div className="modal fade show" role="dialog" style={{display: (showModal ? "block" : "none")}} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{localized.sellBtn}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>{localized.invoiceHelperText}</p>
                <a href={`lightning:${invoice}`}>
                  <QRCode
                      value={invoice}
                      size={320}
                      logoImage={"https://pay.bitcoinjungle.app/BJQRLogo.png"}
                      logoWidth={100}
                  />
                </a>
                <div>
                  <button className="btn btn-primary" onClick={copyToClipboard}>
                      Copy Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showModal &&
          <div className="modal-backdrop fade show"></div>
        }
    </>
  )
}

export default Modal