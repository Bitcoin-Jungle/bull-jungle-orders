import { QRCode } from "react-qrcode-logo"

import { isFromBJ } from '../utils/index'

function Invoice({ invoice, localized }) {

const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(invoice)
      setTimeout(() => {
        alert("Invoice copied to clipboard")
      }, 50)
    } catch(e) {

    }
  }

  const aHref = (isFromBJ() ? `bitcoinjungle://${invoice}` : `lightning:${invoice}`)

  return (
    <div>
      <div className="modal-header">
        <h5 className="modal-title">{localized.sellBtn}</h5>
      </div>
      <div className="modal-body">
        <p>{localized.invoiceHelperText}</p>
        <a href={aHref}>
          <QRCode
              value={invoice}
              size={320}
              logoImage={"/BJQRLogo.png"}
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
  )
}

export default Invoice
