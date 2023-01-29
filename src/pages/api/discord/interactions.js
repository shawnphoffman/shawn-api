import { InteractionType, InteractionResponseType, verifyKeyMiddleware } from 'discord-interactions'

const PUBLIC_KEY = process.env.DISCORD_APP_PUBLIC_KEY

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

	const interaction = req.body
	const commandId = interaction.data.id

	console.log(interaction)

	// Slash Commands
	if (interaction.type === InteractionType.APPLICATION_COMMAND) {
		// /hello
		if (commandId === process.env.DISCORD_COMMAND_ID_HELLO) {
			console.log('hello')
			res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `Hello, I'm RoboHawes! It's currently <t:${Math.round(Date.now() / 1000)}:F>.`,
				},
			})
			return
		}

		// /generate
		if (commandId === process.env.DISCORD_COMMAND_ID_NAMES) {
			const options = interaction.data.options.reduce((el, memo) => {
				memo[el.name] = el.value
				return memo
			}, {})

			console.log({ options, og: JSON.stringify(interaction.data.options, null, 2) })

			const { first, last, maiden, town } = options
			const outFirst = properName(`${last.substr(0, 3)}${first.substr(0, 2)}`)
			const outLast = properName(`${maiden.substr(0, 2)}${town.substr(0, 3)}`)

			res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `Your Star Wars name is **${outFirst} ${outLast}**`,
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									label: 'Web Version',
									style: 5,
									url: 'https://shawn.party/star-wars/names',
								},
							],
						},
					],
				},
			})
			return
		}

		console.log('whoops')
		res.status(400).send('bad request')
		return
	}

	res.status(400).end('use case not met')
}

export const config = {
	api: {
		bodyParser: false,
	},
}
