const { DiscordInteractions } = require('slash-commands')
const dotenv = require('dotenv')

dotenv.config()

const appId = process.env.DISCORD_APP_ID
const authToken = process.env.DISCORD_BOT_TOKEN
const publicKey = process.env.DISCORD_APP_PUBLIC_KEY
const guildId = process.env.DISCORD_GUILD_ID

// console.log({
// 	appId,
// 	authToken,
// 	publicKey,
// 	guildId,
// })

const interaction = new DiscordInteractions({
	applicationId: appId,
	authToken: authToken,
	publicKey: publicKey,
})

async function createCommand() {
	const command = {
		name: 'generate-star-wars-name',
		description: 'Generates your Star Wars RPG name based on inputs',
		options: [
			{
				type: 3, //string
				name: 'first',
				description: 'Your first name',
				required: true,
				min_length: 2,
				max_length: 100,
			},
			{
				type: 3, //string
				name: 'last',
				description: 'Your last name',
				required: true,
				min_length: 2,
				max_length: 100,
			},
			{
				type: 3, //string
				name: 'maiden',
				description: "Your mother's maiden name",
				required: true,
				min_length: 2,
				max_length: 100,
			},
			{
				type: 3, //string
				name: 'hometown',
				description: 'The town where you were born',
				required: true,
				min_length: 2,
				max_length: 100,
			},
		],
	}

	// Create Guild Command
	interaction
		.createApplicationCommand(command, guildId)
		.then(e => {
			// console.log(e.errors.name._errors)
			console.log(JSON.stringify(e, null, 2))
		})
		.catch(e => {
			// console.log(e.errors.name._errors)
			console.error(JSON.stringify(e, null, 2))
		})

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

// createCommand()
getCommands()
