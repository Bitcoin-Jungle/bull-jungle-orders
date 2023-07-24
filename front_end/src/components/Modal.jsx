import { useEffect } from 'react'

function Modal({ children, toggle, showModal }) {

  useEffect(() => {
    if(showModal) {
      document.querySelector('body').classList.add('modal-open')
      if(toggle) {
        window.addEventListener("mousedown", handleClose)
      }
    } else {
      document.querySelector('body').classList.remove('modal-open')
      if(toggle) {
        window.removeEventListener("mousedown", handleClose)
      }
    }
  }, [showModal])

  const handleClose = () => {
    if(showModal && toggle) {
      toggle(false)
    }
  }

  return (
    <>
      <div className="modal fade show" role="dialog" style={{display: (showModal ? "block" : "none")}} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
            <div className="modal-content">
              {showModal && children}
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