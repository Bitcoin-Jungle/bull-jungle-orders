import './App.css'

import Main from './Main'

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
  
  return (
    <ApolloProvider client={client}>
      <Main client={client} />
    </ApolloProvider>
  )
}

export default App;
