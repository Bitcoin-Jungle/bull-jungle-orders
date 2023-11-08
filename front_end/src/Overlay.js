function Overlay({ localized }) {
  return (
    <div className="overlay box">
      <div className="text-center">
        <h3>{localized.loading}</h3>
        <p>{localized.overlayText}</p>

        <div className="spinner-border" role="status" style={{color: "white"}}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  )
}

export default Overlay