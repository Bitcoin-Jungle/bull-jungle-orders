import { gql } from "@apollo/client"

const RECIPIENT_WALLET_ID = gql`
  query userDefaultWalletId($username: Username!) {
    recipientWalletId: userDefaultWalletId(username: $username)
  }
`

const LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT = gql`
  mutation lnInvoiceCreateOnBehalfOfRecipient($walletId: WalletId!, $amount: SatAmount!) {
    mutationData: lnInvoiceCreateOnBehalfOfRecipient(
      input: { recipientWalletId: $walletId, amount: $amount }
    ) {
      errors {
        message
      }
      invoice {
        paymentRequest
      }
    }
  }
`

export { 
  RECIPIENT_WALLET_ID, 
  LN_INVOICE_CREATE_ON_BEHALF_OF_RECIPIENT
}