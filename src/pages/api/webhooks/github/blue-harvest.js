// import Cors from 'src/utils/cors'

// DEPLOYMENT STATUS
// https://docs.github.com/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#deployment_status

// PUSH
// https://docs.github.com/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push

// HEADER
// x-hub-signature-256

export default async function handler(req, res) {
	// await Cors(req, res, {
	// 	methods: ['GET', 'OPTIONS'],
	// 	origin: [/shawn\.party$/],
	// })

	const body = req.body
	console.log('')
	console.log('WEBHOOK BODY')
	console.log({ body })
	console.log('=============')
	console.log('')

	res.status(200).json({ blue: 'harvest' })
}
