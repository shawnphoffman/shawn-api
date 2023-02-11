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

	// Commits Pushed
	if (body.ref && body.commits) {
		const pusher = body.pusher.name
		const branch = body.ref
		const headMsg = body.head_commit.message
		const headUrl = body.head_commit.url

		console.log('Commits Pushed!')
		console.log({
			pusher,
			branch,
			headMsg,
			headUrl,
		})
	}

	// Deployment Status Update
	if (body.deployment_status) {
		const rawEnv = body.deployment_status.environment
		const status = body.deployment_status.state
		const url = ''

		console.log('Deployment Status!')
		console.log({
			rawEnv,
			status,
			url,
		})
	}

	res.status(200).json({ blue: 'harvest' })
}
