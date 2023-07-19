import './App.css'

import Main from './Main'
import Register from './Register'

import { isRegistered, isFromBJ } from './utils'

import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  HttpLink,
} from "@apollo/client"

const httpLink = new HttpLink({
  uri: "https://api.mainnet.bitcoinjungle.app/graphql",
})

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})

function App() {
  const registeredUser = isRegistered()
  const fromBj = isFromBJ()

  if(fromBj && !registeredUser) {
    return (
      <Register />
    )
  }
  
  return (
    <ApolloProvider client={client}>
      <Main client={client} />
    </ApolloProvider>
  )
}

export default App;
