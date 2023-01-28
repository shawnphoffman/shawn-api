const nacl = require('tweetnacl')
const getRawBody = require('raw-body')

// Your public key can be found on your application in the Developer Portal
const PUBLIC_KEY = process.env.DISCORD_APP_PUBLIC_KEY

const InteractionHeader = {
	Signature: 'X-Signature-Ed25519', // as a signature
	Timestamp: 'X-Signature-Timestamp', // as a timestamp
}

const InteractionType = {
	PING: 1,
	APPLICATION_COMMAND: 2,
	MESSAGE_COMPONENT: 3,
	APPLICATION_COMMAND_AUTOCOMPLETE: 4,
	MODAL_SUBMIT: 5,
}

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.status(200).end()
		return
	}

	const rawBody = await getRawBody(req, { encoding: true })
	const body = JSON.parse(rawBody)
	const { type } = body

	const signature = req.headers[InteractionHeader.Signature.toLowerCase()]
	const timestamp = req.headers[InteractionHeader.Timestamp.toLowerCase()]

	// console.log({
	// 	type,
	// 	signature,
	// 	timestamp,
	// 	rawBody: rawBody,
	// 	body: body,
	// 	headers: req.headers,
	// })

	let isVerified
	try {
		isVerified = nacl.sign.detached.verify(Buffer.from(timestamp + body), Buffer.from(signature, 'hex'), Buffer.from(PUBLIC_KEY, 'hex'))
	} catch {
		isVerified = false
	}

	if (!isVerified) {
		return res.status(401).end('invalid request signature')
	}

	if (type === InteractionType.PING) {
		res.status(200).json({ type: 1 })
		return
	}

	res.status(400).end('use case not met')
}

export const config = {
	api: {
		bodyParser: false,
	},
}
