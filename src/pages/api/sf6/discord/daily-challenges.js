import { getChallenges } from '../challenges'
// import { crossPostMessage } from '@/utils/discord'

const formatTasks = tasks => {
	return tasks.map(t => {
		return `- ${t.description} (${t.mode})\n`
	})
	// .join('')
}

const formatChallenge = challenge => {
	const tasks = formatTasks(challenge.tasks)
	return `**${challenge.title}**
Ends: ${challenge.endDate}PM
Reward: ${challenge.reward.item} x${challenge.reward.qty}
Tasks:
${tasks}`
}

// function spliceIntoChunks(arr, chunkSize = 4) {
// 	const res = []
// 	while (arr.length > 0) {
// 		const chunk = arr.splice(0, chunkSize)
// 		res.push(chunk)
// 	}
// 	return res
// }

async function sendWebhook(url, content) {
	var myHeaders = new Headers()
	myHeaders.append('Content-Type', 'application/json')

	var requestOptions = {
		headers: myHeaders,
		method: 'POST',
		body: JSON.stringify(content),
	}

	const response = await fetch(url, requestOptions)

	console.log('-----------------')
	console.log('WEBHOOK RESPONSE')
	console.log(`Status: ${response.status}`)
	console.log(`Status Text: ${response.statusText}`)
	try {
		const json = await response.json()
		return json
	} catch (e) {}
}

async function handler(req, res) {
	const challenges = await getChallenges()

	if (challenges.length) {
		// DISCORD_WEBHOOK_SF6
		const resp = await sendWebhook(process.env.DISCORD_WEBHOOK_BOT_SF6, {
			username: `Street Fighter 6 Challenges`,
			content: challenges.map(formatChallenge).join('\n'),
			avatar_url: 'https://blueharvest.rocks/bots/bh_pink@2x.png',
		})

		// TODO Maybe?
		// if (resp && resp.id && resp.channel_id && resp.author?.bot) {
		// 	await crossPostMessage(resp.channel_id, resp.id)
		// }
	}

	res.status(200).json({
		success: true,
		challenges,
	})
}

export default handler

export const config = {
	api: {
		bodyParser: false,
	},
}
