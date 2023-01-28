import { InteractionType, verifyKeyMiddleware } from 'discord-interactions'
// const getRawBody = require('raw-body')

// const InteractionType = {
// 	PING: 1,
// 	APPLICATION_COMMAND: 2,
// 	MESSAGE_COMPONENT: 3,
// 	APPLICATION_COMMAND_AUTOCOMPLETE: 4,
// 	MODAL_SUBMIT: 5,
// }

const PUBLIC_KEY = process.env.DISCORD_APP_PUBLIC_KEY

// const InteractionHeader = {
// 	Signature: 'X-Signature-Ed25519', // as a signature
// 	Timestamp: 'X-Signature-Timestamp', // as a timestamp
// }

function runMiddleware(req, res, fn) {
	return new Promise((resolve, reject) => {
		req.header = name => req.headers[name.toLowerCase()]
		req.body = JSON.stringify(req.body)
		fn(req, res, result => {
			if (result instanceof Error) return reject(result)
			return resolve(result)
		})
	})
}

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.status(401).end('invalid method')
		return
	}

	await runMiddleware(req, res, verifyKeyMiddleware(PUBLIC_KEY))

	const rawBody = await getRawBody(req, { encoding: true })
	const body = JSON.parse(rawBody)
	const { type } = body

	// const signature = req.headers[InteractionHeader.Signature.toLowerCase()]
	// const timestamp = req.headers[InteractionHeader.Timestamp.toLowerCase()]

	// console.log({
	// 	type,
	// 	signature,
	// 	timestamp,
	// 	rawBody: rawBody,
	// 	body: body,
	// 	headers: req.headers,
	// })

	// let isVerified
	// try {
	// 	isVerified = nacl.sign.detached.verify(Buffer.from(timestamp + body), Buffer.from(signature, 'hex'), Buffer.from(PUBLIC_KEY, 'hex'))
	// } catch {
	// 	isVerified = false
	// }

	// if (!isVerified) {
	// 	return res.status(401).end('invalid request signature')
	// 	return
	// }

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
