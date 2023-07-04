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

const isFromBJ = () => {
  const params = (new URL(document.location)).searchParams;
  const key = params.get("fromBJ");

  if(key && key.length > 0) {
    return true
  }

  return false
}

export { getApiKey, getPhoneNumber, getUsername, isFromBJ }