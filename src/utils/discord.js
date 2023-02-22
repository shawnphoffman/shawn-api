const botToken = process.env.DISCORD_BOT_TOKEN

export const crossPostMessage = async (channelId, messageId) => {
	try {
		const url = `https://discord.com/api/channels/${channelId}/messages/${messageId}/crosspost`
		const options = {
			method: 'POST',
			headers: {
				Authorization: `Bot ${botToken}`,
			},
		}
		const resp = await fetch(url, options)
		const json = await resp.json()

		if (json && json.flags === 1) {
			console.log(`CrossPost Success (${messageId})`)
		}
	} catch (e) {
		console.log(`CrossPost Error (${messageId})`)
		console.error(e)
	}
}
