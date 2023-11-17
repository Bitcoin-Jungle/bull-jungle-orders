const en = {
	title: "Send & Receive To SINPE Móvil",

	apiKeyTitle: "API Key",
	apiKeyHelper: "Enter your API Key here",

	crc: "Colónes",
	usd: "Dollars",

	registerTitle: "Welcome!",
	registerSubtext1: "It looks like this is your first time here.",
	registerSubtext2: "Please request access by clicking the button below.",
	registerBtn: "Request Access Now!",
	registerSuccess: "Thanks for requesting access. We will review your request shortly. Please review the rules for buying Bitcoin below. Please reach out to us on WhatsApp at +506 8783-3773 to let us know you have read and understand the rules.",
	goBackBtn: "Go Back",

	buyBtn: "Buy",
	buyBtnHelper: "Receive Bitcoin in your wallet",
	sellBtn: "Sell",
	sellBtnHelper: "Send a SINPE payment",
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

	sellPaymentDescHelper: "Optionally, include a message with your payment. This will be visible to the recipient.",
	
	bitcoinJungleWallet: "Bitcoin Jungle Wallet",
	lightningWallet: "Other Lightning Wallet",

	bjUsernamePrompt: "What is your Bitcoin Jungle username?",

	rulesTitle: "Important Rules",
	rulesInstructionsBefore: "Please keep the following rules in mind before making your bank transfer.",
	rules1: "We don't accept third party transfers. This means that all funds must originate from a bank account in your (or your business) name.",
	rules2: "We recommend not writing things like bitcoin, btc, crypto, et. cetera. in the memo field. This is for your privacy.",
	rules3: "We only accept instant transfers. Do not select the slow 1-3 day transfer option.",
	rules4: "Your order currency must match the currency you send to us from your bank.",
	rulesInstructionsAfter: "Failure to adhere to these rules may result in a permanent ban from Bull Bitcoin and Toro Pagos.",

	paymentOptionsTitle: "Payment Options",
	paymentOptionsInstructionBefore: "Before submitting this order, you must send {fiatAmount} {fiatCurrency} to us from your bank account. Choose one of the bank accounts below to send to.",
	paymentIdNumber: "Our Cédula Jurídica is 3-102-875766, Toro Pagos Limitada.",
	paymentOptionsInstructionAfter: "After sending {fiatAmount} {fiatCurrency} to us, copy the payment reference provided to you by your bank and paste it below. You must complete this step to receive your bitcoin.",
	
	crcAccount: "Colones Account",
	usdAccount: "Dollar Account",
	
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

	verifyNumber: "Verify Phone Number",
	numberVerifiedTo: "This phone number is registered with SINPE Móvil to",
	verifyIban: "Verify IBAN Account",
	ibanVerifiedTo: "This IBAN account is registered to",

	to: "to",

	overPerTxnLimit: "The per transaction limit is $1000 CAD.",
	underPerTxnMinimum: "The minimum per transaction is ₡2.000 CRC",

	step: "Step",

	step1Title: "Select which action you would like to take.",
	step2Title: "Enter an amount (in dollars or colones) to",
	step3Title: "Enter your phone number so that we can contact you in case of any issue.",
	step4Title: "Enter the payment destination details.",
	step5Title: "Please review the information below & send your payment before submitting this order.",
	step6Title: "Include a message with your payment.",

	buy: "buy",
	sell: "sell",
	index: "index",
	billpay: "pay bill",

	continue: "Continue...",
	confirm: "Confirm",

	terms: "Terms & Conditions",
	priceHistory: "Price History",
	support: "WhatsApp Support",

	orderSuccess: "Order submitted successfully. We will review and process it shortly. Please contact us on WhatsApp with any questions.",
	orderSuccessTitle: "Order submitted successfully!",
	orderSuccessMessage: "We will review and process it shortly. Please contact us on WhatsApp with any questions.",

	statusUpdateTitle: "System Status Update",

	loading: "Loading",
	overlayText: "Please don't leave or close the app until your order is complete.",

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
		isOverDailyLimit: "Your daily limits are BUY: ${dailyBuyLimit} CAD, SELL: ${dailySellLimit} CAD. This order would exceed these daily limits for your account. Please lower the amount or try again tomorrow.",
		duplicateOrder: "This appears to be a duplicate order. Please wait a few minutes and ensure your order has processed completely before trying again.",
		paymentDestinationBlocked: "This payment destination has been permanently blocked.",
	},
}

export default en