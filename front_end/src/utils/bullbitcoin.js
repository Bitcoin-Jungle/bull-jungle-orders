const fetchBbApi = async ({ service, method, params = {} }) => {
  try {
    const response = await fetch(`https://api02.bullbitcoin.dev/${service}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Math.floor(Math.random() * 1001).toString(),
        method: method,
        params: params,
      })
    })

    return response

  } catch (error) {
    console.log('fetchBbApi error', {service, method, params, error})
    return false
  }
}

export { fetchBbApi }