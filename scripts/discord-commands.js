const { DiscordInteractions } = require('slash-commands')
const dotenv = require('dotenv')

dotenv.config()

const appId = process.env.DISCORD_APP_ID
const authToken = process.env.DISCORD_BOT_TOKEN
const publicKey = process.env.DISCORD_APP_PUBLIC_KEY
const guildId = process.env.DISCORD_GUILD_ID

console.log({
	appId,
	authToken,
	publicKey,
	guildId,
})

const interaction = new DiscordInteractions({
	applicationId: appId,
	authToken: authToken,
	publicKey: publicKey,
})

async function createCommandHello() {
	const command = {
		name: 'hello',
		description: 'Responds with a salutation',
		options: [],
	}

	// Create Guild Command
	interaction.createApplicationCommand(command, guildId).then(console.log).catch(console.error)

	/*
	{
		id: '1069032876768763956',
		application_id: '676933166329495592',
		version: '1069032876768763957',
		default_permission: true,
		default_member_permissions: null,
		type: 1,
		nsfw: false,
		name: 'hello',
		name_localizations: null,
		description: 'Responds with a salutation',
		description_localizations: null,
		guild_id: '471428649200123915'
	}
	*/
}

async function getCommands() {
	await interaction.getApplicationCommands(guildId).then(console.log).catch(console.error)
}

getCommands()
