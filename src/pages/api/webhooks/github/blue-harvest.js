// import Cors from 'src/utils/cors'

import { sendWebhook } from '../../star-wars/daily-check'

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

		const msg = `**Blue Harvest Site Commits Pushed**
- Pusher: ${pusher}
- Branch: ${branch}
	- HEAD Message: ${headMsg}
	- HEAD URL: ${headUrl}`

		sendWebhook(process.env.DISCORD_WEBHOOK_BOT_ALERTS, {
			username: `Website Push Notifier`,
			content: msg,
			avatar: 'https://i.imgur.com/NBvUAic.jpg',
		})

		// console.log('Commits Pushed!')
		// console.log({
		// 	pusher,
		// 	branch,
		// 	headMsg,
		// 	headUrl,
		// })
		res.status(200).end()
		return
	}

	// Deployment Status Update
	if (body.deployment_status) {
		const rawEnv = body.deployment_status.environment
		const status = body.deployment_status.state
		let url = ''
		switch (rawEnv) {
			case 'Production – my-weird-foot':
				url = 'https://myweirdfoot.com'
				break
			case 'Preview – my-weird-foot':
				url = 'https://dev.myweirdfoot.com'
				break
			case 'Production – blue-harvest-rocks':
				url = 'https://blueharvest.rocks'
				break
			case 'Preview – blue-harvest-rocks':
				url = 'https://dev.blueharvest.rocks'
				break
			default:
				url = 'https://blueharvest.rocks [fallback]'
				break
		}

		const msg = `**Blue Harvest Site Deployment**
- Environment: ${rawEnv}
- Status: ${status}
- **Public URL**: ${url}`

		sendWebhook(process.env.DISCORD_WEBHOOK_BOT_ALERTS, {
			username: `Website Deployment Notifier`,
			content: msg,
			avatar: 'https://i.imgur.com/NBvUAic.jpg',
		})

		// console.log('Deployment Status!')
		// console.log({
		// 	rawEnv,
		// 	status,
		// 	url,
		// })
		res.status(200).end()
		return
	}

	res.status(200).json({ blue: 'harvest' })
}
