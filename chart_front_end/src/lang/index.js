import en from './en'
import es from './es'

export const localizeText = (lang) => {
  if(lang.indexOf('en') === 0) {
    return en
  }

  if(lang.indexOf('es') === 0) {
    return es
  }

  return en
}

export const localize = (localized, key, vars) => {
  let output = localized[key] || ""

  if(vars) {
    const varKeys = Object.keys(vars)
    for (var i = varKeys.length - 1; i >= 0; i--) {
      const varKey = varKeys[i]
      const myVar = vars[varKey]

      output = output.replace(`{${varKey}}`, myVar)
    }
  }

  return output
}