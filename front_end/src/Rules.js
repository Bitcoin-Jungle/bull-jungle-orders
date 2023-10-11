function Rules({ localized }) {
  return (
    <div className="alert alert-warning">
      <p>
        <b>🚨 {localized.rulesTitle} 🚨</b>
        <br />
        <span>
          {localized.rulesInstructionsBefore}
        </span>
        <ol>
          <li>
            {localized.rules1}
          </li>
          <li>
            {localized.rules2}
          </li>
          <li>
            {localized.rules3}
          </li>
          <li>
            {localized.rules4}
          </li>
        </ol>
        <span>
          {localized.rulesInstructionsAfter}
        </span>
      </p>
    </div>
  )
}

export default Rules