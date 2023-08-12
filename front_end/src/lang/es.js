const es = {
	title: "Enviar & Recibir con SINPE Móvil",

	apiKeyTitle: "Contraseña",
	apiKeyHelper: "Ingrese tu contraseña aquí",

	registerTitle: "¡Bienvenido!",
	registerSubtext1: "Parece que esta es tu primera vez aquí.",
	registerSubtext2: "Solicite acceso haciendo clic en el botón de abajo.",
	registerBtn: "¡Solicitar acceso ahora!",
	registerSuccess: "Gracias por solicitar acceso. Revisaremos tu solicitud en breve. ¡Vuelve aquí más tarde!",
	goBackBtn: "Regresar",

	buyBtn: "Compra BTC",
	sellBtn: "Vende BTC",
	billPayBtn: "Paga Factura",

	fiatAmountTitle: "Monto",
	fiatAmountHelper: "Ingrese el monto",

	fiatCurrencyTitle: "Tipo Moneda",
	fiatCurrencyHelper: "Seleccione el tipo de moneda",

	satAmountTitle: "Cantidad Sats",
	satAmountHelper: "Tipo de cambio se actualiza a partir de",

	phoneNumberTitle: "Número de teléfono",
	phoneNumberHelper: "Ingresa su número de teléfono aqui",

	sellPaymentReqHelper: "Ingresa el número de teléfono de SINPE Móvil o número de cuenta IBAN al que deseas recibir el pago",
	buyPaymentReqHelper: "Ingresa una factura lightning donde quieres recibir el bitcoin",

	bitcoinJungleWallet: "Bitcoin Jungle Wallet",
	lightningWallet: "Otro Lightning Wallet",

	bjUsernamePrompt: "Cual es tu nombre de usario en la app Bitcoin Jungle?",

	paymentOptionsTitle: "Opciones de pago",
	paymentOptionsInstructionBefore: "Antes de enviar el orden, debe enviar",
	paymentOptionsInstructionsAfter: "a una de las siguientes opciones",

	crcAccount: "Cuenta CRC",
	usdAccount: "Cuenta USD",
	
	paymentIdentifierTitle: "Número de Comprobante del Pago",
	paymentIdentifierHelper: "Por lo general, recibirá un número de comprobante de pago de 25 dígitos. Si su banco no proporciona esto, ingrese el número proporcionado por su banco. Tenga en cuenta que esto puede causar retrasos.",
	paymentConfirmationLabel: "Ya he enviado el pago con este número de comprobante",
	
	billerCategoryTitle: "Categoría del facturador",
	billerServiceTitle: "Servicio de facturación",
	billerActionTypeTitle: "Tipo de acción del facturador",
	billerAccountNumberTitle: "Número de cuenta del facturador",

	invoiceHelperText: "Escanee o haga clic en el código QR para pagar",

	createOrderBUY: "Compra Ahora",
	createOrderSELL: "Envia Pago",
	createOrderBILLPAY: "Paga Factura",

	to: "a",

	overPerTxnLimit: "El límite por transacción es de $1000 CAD.",
	underPerTxnMinimum: "El mínimo por transacción es de ₡2.000 CRC",

	step: "Paso",

	step1Title: "Seleccione qué acción le gustaría tomar.",
	step2Title: "Ingrese una cantidad (en dólares o colones) a",
	step3Title: "Ingrese su número de teléfono para que podamos comunicarnos con usted en caso de cualquier problema.",
	step4Title: "Ingrese el destino del pago.",
	step5Title: "Revise la información a continuación y envíe su pago antes de enviar este pedido.",
	
	buy: "comprar",
	sell: "vender",
	billpay: "pagar factura",

	continue: "Continuar...",
	confirm: "Confirmar",

	terms: "Términos y condiciones",

	orderSuccess: "Pedido enviado con éxito. Lo revisaremos y procesaremos en breve. Contáctenos por WhatsApp si tiene alguna pregunta.",

	errors: {
		apiKeyRequired: "Se requiere la clave API.",
		apiKeyIncorrect: "La clave API es incorrecta.",
		fiatAmountRequired: "Se requiere el monto de la moneda.",
		fiatCurrencyRequired: "Se requiere moneda.",
		invalidFiatCurrency: "La moneda debe ser USD o CRC.",
		satAmountRequired: "Se requiere la cantidad de BTC.",
		actionRequired: "Se requiere acción.",
		paymentReqRequired: "Se requiere el destino del pago.",
		invalidBillPaySettings: "Debe proporcionar una categoría de facturador, servicio, acción y número de cuenta para pagar una factura.",
		phoneNumberRequired: "Se requiere un número de teléfono.",
		invalidAction: "La acción debe ser COMPRAR, VENDER o PAGAR FACTURA.",
		invalidPaymentReqBuy: "El destino del pago debe comenzar con lnbc.",
		paymentIdentifierRequired: "Se requiere el número de comprobante del pago.",
		paymentIdentifierUsed: "Este comprobante de pago ya se usó en otro pedido.",
		usdIbanRequired: "Al seleccionar la moneda USD, el destino del pago debe ser una cuenta IBAN.",
		invalidPaymentReqSell: "Debe proporcionar un número de cuenta IBAN válido o un número de teléfono móvil SINPE.",
		invalidInvoice: "Cuando la acción es VENDER o FACTURAR, debe proporcionar una factura y un hash de pago y una marca de tiempo.",
		invalidFiatAmount: "Hay un límite por transacción de $1000 CAD.",
		invoiceNotPaid: "La factura no ha sido pagada. Intente realizar su pedido de nuevo.",
		pendingApproval: "Su solicitud está pendiente. Si ha pasado un tiempo y no ha escuchado nada de nosotros, intente contactarnos en WhatsApp.",
	},

}

export default es