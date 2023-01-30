// import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
// import * as cheerio from 'cheerio'
import { verifySignature } from '@upstash/qstash/nextjs'
import { getComics } from './future-comics'

const processComic = comic => {
	// const pubDate = new Date(comic.pubDate).toLocaleDateString('en-US', options)
	// - Release Date: ${pubDate}
	return `
**${comic.title}**
https://starwars.fandom.com${comic.url}`
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

	console.log(response)
}

async function handler(req, res) {
	const today = new Date('2023-01-31T08:00:00.000Z').setHours(0, 0, 0, 0)

	// Comics
	const comics = await getComics()
	const todayComics = comics.filter(c => {
		const pubDate = new Date(c.pubDate).setHours(0, 0, 0, 0)
		return today === pubDate
	})

	await sendWebhook(process.env.DISCORD_WEBHOOK_COMICS, {
		username: 'Comics Releasing Today',
		content: todayComics.map(processComic).join('\n'),
	})

	res.status(200).json({ success: true, todayComics })
}

const isLocal = process.env.LOCAL || false

export default isLocal ? handler : verifySignature(handler)

export const config = {
	api: {
		bodyParser: false,
	},
}
