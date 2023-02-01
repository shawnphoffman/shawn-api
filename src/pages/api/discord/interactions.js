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
function properName(name) {
	return (
		'' +
		name
			.replace(/[^\s\-\']+[\s\-\']*/g, function (word) {
				return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
			})
			.replace(/\b(Van|De|Der|Da|Von)\b/g, function (wat) {
				return wat.toLowerCase()
			})
			.replace(/Mc(.)/g, function (match, letter3) {
				return 'Mc' + letter3.toUpperCase()
			})
	)
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

		// temp
		if (commandId === '1070467892598022235') {
			res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: "I'm not dumb",
				},
			})
			return
		}

		// /generate
		if (commandId === process.env.DISCORD_COMMAND_ID_NAMES) {
			const options = interaction.data.options.reduce((memo, el) => {
				memo[el.name] = el.value
				return memo
			}, {})

			const { first, last, maiden, hometown } = options
			const outFirst = properName(`${last.substr(0, 3)}${first.substr(0, 2)}`)
			const outLast = properName(`${maiden.substr(0, 2)}${hometown.substr(0, 3)}`)

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
									url: `https://shawn.party/star-wars/names?first=${first}&last=${last}&maiden=${maiden}&town=${hometown}`,
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
