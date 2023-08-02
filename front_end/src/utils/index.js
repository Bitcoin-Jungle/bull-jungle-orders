const getApiKey = () => {
  const params = (new URL(document.location)).searchParams;
  const key = params.get("key");

  if(key && key.length > 0) {
    return key
  }

  return ""
}

const getPhoneNumber = () => {
  const params = (new URL(document.location)).searchParams;
  const key = params.get("phone");

  if(key && key.length > 0) {
    return key
  }

  return ""
}

const getUsername = () => {
  const params = (new URL(document.location)).searchParams;
  const key = params.get("username");

  if(key && key.length > 0) {
    return key
  }

  return ""
}

const getLanguage = () => {
  const params = (new URL(document.location)).searchParams;
  const key = params.get("lang");

  if(key && key.length > 0 && key !== "DEFAULT") {
    return key
  }
  
  return navigator.language || navigator.userLanguage || 'en'
}

const isFromBJ = () => {
  const params = (new URL(document.location)).searchParams;
  const key = params.get("fromBJ");

  if(key && key.length > 0) {
    return true
  }

  return false
}

const isRegistered = () => {
  const params = (new URL(document.location)).searchParams;
  const key = params.get("registered");

  if(key && key.length > 0 && key !== "false") {
    return true
  }

  return false
}

const isInIframe = () => {
  try {
      return window.self !== window.top;
  } catch (e) {
      return true;
  }
}

export { getApiKey, getPhoneNumber, getUsername, getLanguage, isFromBJ, isRegistered, isInIframe }