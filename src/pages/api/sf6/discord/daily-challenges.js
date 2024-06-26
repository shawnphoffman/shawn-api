import { getChallenges } from '../challenges'

// [Official SF6 Site](https://www.streetfighter.com/6/buckler/reward/challenge)

const getEmoji = name => {
	switch (name.toLowerCase()) {
		case 'fighting ground':
			return '<:sf6_fg:1117220413194391583>'
		case 'battle hub':
			return '<:sf6_bh:1117220412032569434>'
		case 'world tour':
			return '<:sf6_wt:1117220415706779729>'
		case 'drive ticket':
			return '<:sf6_drive:1120140262560235600>'
		case 'kudos':
			return '<:sf6_kudos:1120140670535991306>'
		default:
			return ''
	}
}

const formatTasks = tasks => {
	// if (tasks.length === 1) return `${getEmoji(tasks[0].mode)} ${tasks[0].description}`

	return tasks
		.map(t => {
			return `\n    - ${getEmoji(t.mode)} ${t.description}`
		})
		.join('')
}

const formatChallenge = challenge => {
	const tasks = formatTasks(challenge.tasks)
	return (
		`### ${challenge.title.replace('Challenge ', '')} - ${challenge.endDate.substring(0, 5)} ` +
		`${getEmoji(challenge.reward.item)} ˣ${challenge.reward.qty} ${tasks}`
	)
}

async function sendWebhook(url, content) {
	var myHeaders = new Headers()
	myHeaders.append('Content-Type', 'application/json')

	var requestOptions = {
		headers: myHeaders,
		method: 'POST',
		body: JSON.stringify(content),
	}

	const response = await fetch(url, requestOptions)

	console.log('WEBHOOK RESPONSE')
	console.log(`Status: ${response.status}`)
	console.log(`Status Text: ${response.statusText}`)
	try {
		const json = await response.json()
		return json
	} catch (e) {
		console.error('Error parsing response', e)
	}
}

async function handler(req, res) {
	const challenges = await getChallenges()

	if (challenges.length) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_BOT_SF6, {
			username: `Street Fighter 6 Challenges`,
			content: challenges.map(formatChallenge).join('\n'),
			avatar_url: 'https://blueharvest.rocks/bots/bh_pink@2x.png',
		})
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
