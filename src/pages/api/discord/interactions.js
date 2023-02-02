import { InteractionType, InteractionResponseType, verifyKeyMiddleware } from 'discord-interactions'
import { archiveLink, createLink, getLinks } from './shortio'

const PUBLIC_KEY = process.env.DISCORD_APP_PUBLIC_KEY

// TODO add to env
const shortLinkCommandId = '1070472243630579743'

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

	console.log('===========')
	console.log('INTERACTION')
	console.log('===========')
	console.log(JSON.stringify(interaction, null, 2))

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

		// Short Links
		// This is the parent command ID
		if (commandId === shortLinkCommandId) {
			const subcommand = interaction.data.options[0] || {}

			console.log('')
			console.log('+++++++++')
			console.log('SUBCOMMAND')
			console.log(JSON.stringify(subcommand, null, 2))
			console.log('+++++++++')
			console.log('')

			const options = subcommand.options.reduce((memo, el) => {
				memo[el.name] = el.value
				return memo
			}, {})

			switch (subcommand.name) {
				//
				// ++ GET LINKS
				//
				case 'list':
					console.log('link list')

					const links = await getLinks()

					const components = links.map((link, i) => {
						return {
							type: 1,
							components: [
								{
									type: 2,
									label: links.title ? `${links.title}: ${link.shortURL}` : `${link.shortURL}`,
									style: 5,
									url: link.shortURL,
								},
								{
									type: 2,
									label: `➡️ ${link.originalURL}`,
									style: 5,
									url: link.originalURL,
								},
								{
									type: 2,
									label: `Remove (TBD)`,
									style: 4,
									custom_id: link.id,
								},
							],
						}
					})

					console.log(JSON.stringify(components, null, 2))

					res.send({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: {
							content: `**Current Short Links**`,
							components,
						},
					})
					return
				//
				// ++ CREATE LINK
				//
				case 'create':
					console.log('link create')
					const { url, title, path } = options

					if (!url) {
						res.send({
							type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
							data: {
								content: `EMPTY URL`,
							},
						})
						return
					}

					const link = await createLink(url, title, path)

					if (!link.shortURL) {
						res.send({
							type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
							data: {
								content: `URL WAS NOT CREATED`,
							},
						})
						return
					}

					res.send({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: {
							content: `**Link Created** (${link.shortURL} ➡️ ${link.originalURL})`,
							components: [
								{
									type: 2,
									label: link.shortURL,
									style: 5,
									url: link.shortURL,
								},
							],
						},
					})
					return
			}
		}

		// /generate
		if (commandId === process.env.DISCORD_COMMAND_ID_NAMES) {
			// TODO refactor
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
	} else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
		// HACK: REMOVE LINK BUTTON
		if (interaction?.data?.custom_id) {
			const id = interaction?.data?.custom_id

			console.log('REMOVE LINK')
			console.log(id)
			await archiveLink(id)

			res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: 'LINK REMOVED',
				},
			})
			return
		}
	}

	res.status(400).end('use case not met')
}

export const config = {
	api: {
		bodyParser: false,
	},
}
