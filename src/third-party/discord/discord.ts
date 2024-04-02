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

export const sendWebhook = async (url, content, crossPost) => {
	var myHeaders = new Headers()
	myHeaders.append('Content-Type', 'application/json')

	var requestOptions = {
		headers: myHeaders,
		method: 'POST',
		body: JSON.stringify(content),
	}

	const response = await fetch(url, requestOptions)

	// console.log('-----------------')
	console.log('WEBHOOK RESPONSE')
	console.log(`Status: ${response.status}`)
	console.log(`Status Text: ${response.statusText}`)
	try {
		const json = await response.json()
		if (crossPost) {
			if (json && json.id && json.channel_id && json.author?.bot) {
				await crossPostMessage(json.channel_id, json.id)
			}
		}
	} catch (e) {
		console.error('Error parsing response', e)
	}
}
