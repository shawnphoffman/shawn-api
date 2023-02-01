const { DiscordInteractions, ApplicationCommandOptionType } = require('slash-commands')
const dotenv = require('dotenv')

dotenv.config()

const appId = process.env.DISCORD_APP_ID
const authToken = process.env.DISCORD_BOT_TOKEN
const publicKey = process.env.DISCORD_APP_PUBLIC_KEY
const guildId = process.env.DISCORD_GUILD_ID

const shortLinkCommandId = '1070472243630579743'

const interaction = new DiscordInteractions({
	applicationId: appId,
	authToken: authToken,
	publicKey: publicKey,
})

async function createCommand() {
	const command = {
		name: 'temp',
		description: 'Manage your Short.io links',
		options: [
			{
				name: 'get',
				description: 'get temp',
				type: ApplicationCommandOptionType.SUB_COMMAND,
			},
			{
				name: 'edit',
				description: 'edit temp',
				type: ApplicationCommandOptionType.SUB_COMMAND,
			},
		],
	}

	interaction
		.createApplicationCommand(command, guildId)
		.then(e => {
			console.log(JSON.stringify(e, null, 2))
		})
		.catch(e => {
			console.error(JSON.stringify(e, null, 2))
		})
}

async function updateCommand(id) {
	const command = {
		name: 'links',
		description: 'Manage your Short.io links',
		options: [
			{
				name: 'list',
				description: 'List existing short links',
				type: ApplicationCommandOptionType.SUB_COMMAND,
			},
			{
				name: 'create',
				description: 'Create a new short link',
				type: ApplicationCommandOptionType.SUB_COMMAND,
				options: [
					// url
					{
						name: 'url',
						description: 'URL to shorten',
						type: ApplicationCommandOptionType.STRING,
						required: true,
					},
					{
						name: 'title',
						description: 'Title to display for the URL',
						type: ApplicationCommandOptionType.STRING,
					},
				],
			},
			{
				name: 'remove',
				description: 'Remove an existing short link',
				type: ApplicationCommandOptionType.SUB_COMMAND,
				options: [
					// id to remove
					{
						name: 'id',
						description: 'ID of link to remove',
						type: ApplicationCommandOptionType.STRING,
						required: true,
					},
				],
			},
		],
	}

	// Create Guild Command
	interaction
		.editApplicationCommand(id, command, guildId)
		.then(e => {
			// console.log(e.errors.name._errors)
			console.log(JSON.stringify(e, null, 2))
		})
		.catch(e => {
			// console.log(e.errors.name._errors)
			console.error(JSON.stringify(e, null, 2))
		})
}

async function deleteCommand(id) {
	interaction
		.deleteApplicationCommand(id, guildId)
		.then(e => {
			console.log(JSON.stringify(e, null, 2))
		})
		.catch(e => {
			console.error(JSON.stringify(e, null, 2))
		})
}

async function getCommands() {
	await interaction
		.getApplicationCommands(guildId)
		.then(e => {
			console.log(JSON.stringify(e, null, 2))
		})
		.catch(console.error)
}

// createCommand()
// const id = '1070467892598022235'
updateCommand(shortLinkCommandId)
// deleteCommand(id)
getCommands()
