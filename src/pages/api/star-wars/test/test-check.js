import { getTV } from '../get/future-tv'

const dateString = d => {
	return new Date(d).toDateString()
}

const processTv = tv => {
	const cleanDate = new Date(tv.pubDate).getTime() / 1000
	return `
**${tv.series} (${tv.episode})**
- *Title:* ${tv.title}
- *Release Date*: <t:${cleanDate}:d>
- [*More Info Here*](${tv.url})`
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

	console.log('-----------------')
	console.log('WEBHOOK RESPONSE')
	console.log(`Status: ${response.status}`)
	console.log(`Status Text: ${response.statusText}`)
}

async function handler(req, res) {
	var tomorrow = new Date()
	tomorrow.setHours(0, 0, 0, 0)
	tomorrow.setDate(tomorrow.getDate() + 1)

	// TV
	const tv = await getTV()
	const outTv = tv.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		const test = tomorrow.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	console.log({ outTv })

	if (outTv.length) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_TEMP, {
			username: `TV Shows Premiering (${dateString(tomorrow)})`,
			content: outTv.map(processTv).join('\n'),
			avatar_url: 'https://blueharvest.rocks/bots/bh_teal@2x.png',
		})
	}

	res.status(200).json({
		success: true,
		tvCount: outTv.length,
		outTv,
		tomorrow,
		tv,
	})
}

export default handler

export const config = {
	api: {
		bodyParser: false,
	},
}
