const es = {
	title: "Enviar & Recibir con SINPE Móvil",

	apiKeyTitle: "Contraseña",
	apiKeyHelper: "Ingrese tu contraseña aquí",

	registerTitle: "¡Bienvenido!",
	registerSubtext1: "Parece que esta es tu primera vez aquí.",
	registerSubtext2: "Solicite acceso haciendo clic en el botón de abajo.",
	registerBtn: "¡Solicitar acceso ahora!",
	registerSuccess: "Gracias por su solicitud, lo revisaremos en breve. Por favor, revise las reglas para comprar Bitcoin a continuación. Comuníquese con nosotros por WhatsApp al +506 8783-3773 para informarnos que ha leído y comprendido las reglas.",
	goBackBtn: "Regresar",

	buyBtn: "Comprar",
	buyBtnHelper: "Reciba Bitcoin en su cartera",
	sellBtn: "Vender",
	sellBtnHelper: "Envie un pago por SINPE",
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

	sellPaymentDescHelper: "Opcionalmente, incluya un mensaje con su pago.",
	
	bitcoinJungleWallet: "Bitcoin Jungle Wallet",
	lightningWallet: "Otro Lightning Wallet",

	bjUsernamePrompt: "Cual es tu nombre de usario en la app Bitcoin Jungle?",

	rulesTitle: "Reglas Importantes",
	rulesInstructionsBefore: "Tenga en cuenta las siguientes reglas antes de realizar su transferencia bancaria.",
	rules1: "No aceptamos transferencias de terceros. Esto significa que todos los fondos deben provenir de una cuenta bancaria a su nombre (o el de su empresa).",
	rules2: "Recomendamos no escribir cosas como bitcoin, btc, crypto, etc. en el campo memo. Esto es por tu privacidad.",
	rules3: "Sólo aceptamos transferencias instantáneas. No seleccione la opción de transferencia lenta de 1 a 3 días.",
	rulesInstructionsAfter: "El incumplimiento de estas reglas puede resultar en una prohibición permanente de Bull Bitcoin y Toro Pagos.",

	paymentOptionsTitle: "Opciones de pago",
	paymentOptionsInstructionBefore: "Antes de realizar la compra, debe enviar",
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

	verifyNumber: "Verifica número de teléfono",
	numberVerifiedTo: "Este número de teléfono está registrado a",
	verifyIban: "Verifica Cuenta IBAN",
	ibanVerifiedTo: "Esta cuenta IBAN está registrada a",

	to: "a",

	overPerTxnLimit: "El límite por transacción es de $1000 CAD.",
	underPerTxnMinimum: "El mínimo por transacción es de ₡2.000 CRC",

	step: "Paso",

	step1Title: "Seleccione qué acción le gustaría tomar.",
	step2Title: "Ingrese una cantidad (en dólares o colones) a",
	step3Title: "Ingrese su número de teléfono para que podamos comunicarnos con usted en caso de cualquier problema.",
	step4Title: "Ingrese el destino del pago.",
	step5Title: "Revise la información a continuación y envíe su pago antes de enviar este pedido.",
	step6Title: "Incluya un mensaje con su pago.",

	buy: "comprar",
	sell: "vender",
	billpay: "pagar factura",

	continue: "Continuar...",
	confirm: "Confirmar",

	terms: "Términos y condiciones",
	showPriceHistory: "Mostrar historial",
	hidePriceHistory: "Esconder historial",
	support: "Soporte por WhatsApp",

	orderSuccess: "Pedido enviado con éxito. Lo revisaremos y procesaremos en breve. Contáctenos por WhatsApp si tiene alguna pregunta.",
	orderSuccessTitle: "¡Pedido enviado con éxito!",
	orderSuccessMessage: "Lo revisaremos y procesaremos en breve. Contáctenos por WhatsApp si tiene alguna pregunta.",

	statusUpdateTitle: "Actualización del estado del sistema",

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
		isOverDailyLimit: "Este pedido excedería los límites diarios de su cuenta. Por favor reduzca la cantidad o vuelva a intentarlo mañana.",
		duplicateOrder: "Parece que esta es una orden duplicada. Espere unos minutos y asegúrese de que su pedido se haya procesado por completo antes de volver a intentarlo.",
	},

}

export default es