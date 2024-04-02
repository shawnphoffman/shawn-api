import * as cheerio from 'cheerio'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

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

export default async function handler(req, res) {
	const { scrape: temp } = req.body
	const temp2 = req.query.scrape

	const scrape = temp || temp2

	if (!scrape) {
		res.status(401).send({ go: 'away' })
		return
	}

	const requestOptions = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache(scrape, requestOptions, 15)

	const $ = cheerio.load(data)

	const pageTitle = $('h1').text().trim()

	// // Print some information to actor log
	// console.log(`TITLE: ${pageTitle}`)

	// Woof...
	const comics = $('section.entry-content')
		.text()
		.split('\n')
		.filter(i => !!i)
		.filter(i => i.toLowerCase().includes('star wars'))

	if (comics) {
		const outComics = comics.map(c => `- ${c}`).join('\n')
		await sendWebhook(process.env.DISCORD_WEBHOOK_COMICS, {
			username: `Digital Comics Now Available! `,
			avatar: 'https://blueharvest.rocks/bots/bh_red.png',
			content: `**${pageTitle}**
These comics may or may not be available online digitally. I just do what I'm told...
${outComics}`,
		})
	}

	// res.status(200).send(response)
	res.status(200).send(comics)
}
