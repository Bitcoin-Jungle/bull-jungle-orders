import './App.css'

import Main from './Main'

import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  split,
  HttpLink,
} from "@apollo/client"
import { WebSocketLink } from "@apollo/client/link/ws"
import { getMainDefinition } from "@apollo/client/utilities"

const httpLink = new HttpLink({
  uri: "https://api.mainnet.bitcoinjungle.app/graphql",
})

const wsLink = new WebSocketLink({
  uri: "wss://api.mainnet.bitcoinjungle.app/graphql",
  options: {
    reconnect: true,
  },
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === "OperationDefinition" && definition.operation === "subscription"
    )
  },
  wsLink,
  httpLink,
)

const client = new ApolloClient({
  link: splitLink,
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
