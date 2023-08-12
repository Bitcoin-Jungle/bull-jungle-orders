const en = {
	title: "Send & Receive To SINPE Móvil",

	apiKeyTitle: "API Key",
	apiKeyHelper: "Enter your API Key here",

	registerTitle: "Welcome!",
	registerSubtext1: "It looks like this is your first time here.",
	registerSubtext2: "Please request access by clicking the button below.",
	registerBtn: "Request Access Now!",
	registerSuccess: "Thanks for requesting access. We will review your request shortly. Check back here later!",
	goBackBtn: "Go Back",

	buyBtn: "Buy Bitcoin",
	sellBtn: "Sell Bitcoin",
	billPayBtn: "Bill Pay",

	fiatAmountTitle: "Amount",
	fiatAmountHelper: "Enter the amount in your desired currency",

	fiatCurrencyTitle: "Currency",
	fiatCurrencyHelper: "Select the desired currency",

	satAmountTitle: "Sat Amount",
	satAmountHelper: "Exchange rate is updated as of",

	phoneNumberTitle: "Phone Number",
	phoneNumberHelper: "Enter your phone number here",

	sellPaymentReqHelper: "Enter the SINPE Móvil phone number or IBAN account number you want to receive payment at",
	buyPaymentReqHelper: "Enter a lightning invoice where you want to receive the bitcoin",

	bitcoinJungleWallet: "Bitcoin Jungle Wallet",
	lightningWallet: "Other Lightning Wallet",

	bjUsernamePrompt: "What is your Bitcoin Jungle username?",

	paymentOptionsTitle: "Payment Options",
	paymentOptionsInstructionBefore: "Before submitting the order, you must send",
	paymentOptionsInstructionsAfter: "to one of the following options",
	
	crcAccount: "CRC Account",
	usdAccount: "USD Account",
	
	paymentIdentifierTitle: "Payment Reference #",
	paymentIdentifierHelper: "Typically you will receive a 25 digit payment reference number. If your bank does not provide this, please enter the number provided by your bank. Please note, this may cause delays.",
	paymentConfirmationLabel: "I have sent the payment with the above reference number",

	billerCategoryTitle: "Biller Category",
	billerServiceTitle: "Biller Service",
	billerActionTypeTitle: "Biller Action Type",
	billerAccountNumberTitle: "Biller Account Number",

	invoiceHelperText: "Please scan or click on the QR code to pay",

	createOrderBUY: "Buy Now",
	createOrderSELL: "Send Payment",
	createOrderBILLPAY: "Pay Bill Now",

	to: "to",

	overPerTxnLimit: "The per transaction limit is $1000 CAD.",
	underPerTxnMinimum: "The minimum per transaction is ₡2.000 CRC",

	step: "Step",

	step1Title: "Select which action you would like to take.",
	step2Title: "Enter an amount (in dollars or colones) that you would like to",
	step3Title: "Enter your phone number so that we can contact you in case of any issue.",
	step4Title: "Enter the payment destination details.",
	step5Title: "Please review the information below & send your payment before submitting this order.",

	buy: "buy",
	sell: "sell",
	billpay: "pay bill",

	continue: "Continue...",
	confirm: "Confirm",

	terms: "Terms & Conditions",

	orderSuccess: "Order submitted successfully. We will review and process it shortly. Please contact us on WhatsApp with any questions.",

	errors: {
		apiKeyRequired: "API Key is required.",
		apiKeyIncorrect: "API Key is incorrect.",
		fiatAmountRequired: "Currency Amount is required.",
		fiatCurrencyRequired: "Currency is required.",
		invalidFiatCurrency: "Currency must be USD or CRC.",
		satAmountRequired: "BTC Amount is required.",
		actionRequired: "Action is required.",
		paymentReqRequired: "Payment Destination is required.",
		invalidBillPaySettings: "You must provide a biller category, service, action, & account number to pay a bill.",
		phoneNumberRequired: "A phone number is required.",
		invalidAction: "Action must be BUY, SELL, or BILL PAY.",
		invalidPaymentReqBuy: "Payment Destination must start with lnbc.",
		paymentIdentifierRequired: "Payment Reference is required.",
		paymentIdentifierUsed: "This Payment Reference has already been used on another order.",
		usdIbanRequired: "When selecting USD currency, the payment destination must be an IBAN Account.",
		invalidPaymentReqSell: "You must provide a valid IBAN Account Number or SINPE Movil Phone Number.",
		invalidInvoice: "When action is SELL or BILLPAY, you must provide an invoice and payment hash and timestamp.",
		invalidFiatAmount: "There is a per transaction limit of $1000 CAD.",
		invoiceNotPaid: "Invoice has not been paid. Please try your order again.",
		pendingApproval: "Your request is currently pending. If it's been a while and you haven't heard from us, try contacting us on WhatsApp.",
	},
}

export default en