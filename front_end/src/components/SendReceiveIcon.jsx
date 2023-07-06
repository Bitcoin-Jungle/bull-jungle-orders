import * as React from "react"

const xml_transaction_sent = `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="60px" height="60px" viewBox="20 20 60 60" enable-background="new 20 20 60 60" xml:space="preserve">
<g>
	<path fill="#FFFFFF" d="M44.499,61.99c-0.507,0-1,0.111-1.464,0.33c-1.706,0.811-2.437,2.857-1.628,4.562
		c0.564,1.189,1.781,1.957,3.1,1.957c0.506,0,0.998-0.111,1.461-0.33c0.828-0.393,1.452-1.084,1.76-1.945
		c0.307-0.859,0.26-1.789-0.132-2.617C47.032,62.758,45.816,61.99,44.499,61.99z"/>
	<path fill="{color}" d="M77.103,37.15C70.005,22.183,52.116,15.802,37.15,22.899c-14.966,7.096-21.347,24.983-14.251,39.95
		c7.097,14.969,24.986,21.348,39.951,14.252C77.817,70.004,84.196,52.118,77.103,37.15z M47.253,71.219
		c-0.888,0.422-1.824,0.621-2.746,0.621c-2.404,0-4.711-1.355-5.811-3.672c-1.519-3.207-0.15-7.037,3.055-8.557
		c0.889-0.421,1.826-0.621,2.748-0.621c2.404,0,4.709,1.355,5.807,3.672C51.825,65.869,50.46,69.699,47.253,71.219z M41.875,35.901
		c0.059-0.17,0.153-0.285,0.292-0.353l14.363-6.837c0.146-0.1,0.308-0.12,0.479-0.062c0.167,0.06,0.277,0.175,0.336,0.345
		l6.904,14.331c0.065,0.137,0.066,0.291,0.01,0.458c-0.062,0.17-0.168,0.305-0.313,0.403l-1.364,0.655
		c-0.141,0.067-0.3,0.07-0.463,0.011c-0.173-0.058-0.304-0.164-0.402-0.313l-5.086-10.615l-7.47,21.403
		c-0.061,0.168-0.171,0.291-0.335,0.369c-0.158,0.076-0.322,0.086-0.488,0.025l-1.418-0.5c-0.17-0.059-0.294-0.168-0.372-0.328
		c-0.077-0.16-0.082-0.324-0.023-0.492l7.474-21.402l-10.616,5.084c-0.169,0.054-0.339,0.052-0.508-0.009
		c-0.168-0.06-0.287-0.157-0.353-0.295l-0.654-1.37C41.811,36.238,41.815,36.068,41.875,35.901z"/>
</g>
</svg>`

const xml_transaction_received = `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="60px" height="60px" viewBox="20 20 60 60" enable-background="new 20 20 60 60" xml:space="preserve">
<g>
	<path fill="#FFFFFF" d="M44.498,61.99c-0.507,0-1,0.111-1.464,0.33c-1.706,0.811-2.437,2.857-1.628,4.562
		c0.564,1.189,1.781,1.957,3.1,1.957c0.506,0,0.998-0.111,1.461-0.33c0.828-0.393,1.452-1.084,1.76-1.945
		c0.307-0.859,0.26-1.789-0.132-2.617C47.031,62.758,45.815,61.99,44.498,61.99z"/>
	<path fill="{color}" d="M77.102,37.15c-7.098-14.968-24.986-21.348-39.952-14.251c-14.966,7.096-21.347,24.983-14.251,39.95
		c7.097,14.969,24.986,21.348,39.951,14.252C77.816,70.004,84.195,52.118,77.102,37.15z M47.252,71.219
		c-0.888,0.422-1.824,0.621-2.746,0.621c-2.404,0-4.711-1.355-5.811-3.672c-1.519-3.207-0.15-7.037,3.055-8.557
		c0.889-0.421,1.826-0.621,2.748-0.621c2.404,0,4.709,1.355,5.807,3.672C51.824,65.869,50.459,69.699,47.252,71.219z M62.684,48.281
		c-0.059,0.17-0.154,0.284-0.293,0.352L48,55.412c-0.147,0.1-0.309,0.119-0.479,0.06c-0.167-0.061-0.277-0.176-0.335-0.347
		l-6.847-14.358c-0.064-0.137-0.065-0.291-0.008-0.458c0.063-0.17,0.169-0.304,0.315-0.402l1.367-0.649
		c0.141-0.066,0.3-0.069,0.463-0.009c0.172,0.059,0.303,0.165,0.4,0.315l5.043,10.635l7.557-21.373
		c0.061-0.168,0.172-0.289,0.336-0.367c0.158-0.077,0.322-0.084,0.488-0.024l1.416,0.505c0.17,0.06,0.293,0.169,0.371,0.331
		c0.076,0.161,0.08,0.324,0.021,0.492l-7.561,21.371l10.637-5.041c0.17-0.053,0.34-0.05,0.508,0.011
		c0.168,0.061,0.287,0.159,0.352,0.296l0.648,1.373C62.75,47.944,62.744,48.114,62.684,48.281z"/>
</g>
</svg>
`

export const colorTypeFromIconType = ({ isReceive, isPending }) => (isPending ? "#cecece" : isReceive ? "#459C0B" : "#FF7e1c")

export const SendReceiveIcon = ({ isReceive, pending, size, transparent }) => {
  let color = colorTypeFromIconType({ isReceive, isPending: pending })
  if (transparent) color = "#ffffff"
  const raw_xml = isReceive ? xml_transaction_received : xml_transaction_sent
	const parse_xml = raw_xml.replace("{color}", color)
  return <span style={{width: size, height: size}} dangerouslySetInnerHTML={{__html: parse_xml}}></span>
}
