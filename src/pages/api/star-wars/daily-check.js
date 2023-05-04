import { getAllComics } from './future-comics'
import { getBooks } from './future-books'
import { getTV } from './future-tv'
import { crossPostMessage } from '@/utils/discord'

const dateString = d => {
	return new Date(d).toDateString()
}

const processComic = comic => {
	return `
**${comic.title}**
https://starwars.fandom.com${comic.url}`
}

const processBook = book => {
	return `
**${book.title} (${book.author})**
- ${book.format}
https://starwars.fandom.com${book.url}`
}

const processTv = tv => {
	const cleanDate = new Date(tv.pubDate)
	cleanDate.setDate(cleanDate.getDate() + 1)
	return `
**${tv.series} (${tv.episode})**
- *Title:* ${tv.title}
- *Release Date*: <t:${cleanDate.getTime() / 1000}:d>
- *Link:* ${tv.url}`
}

function spliceIntoChunks(arr, chunkSize = 4) {
	const res = []
	while (arr.length > 0) {
		const chunk = arr.splice(0, chunkSize)
		res.push(chunk)
	}
	return res
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
	try {
		const json = await response.json()
		return json
	} catch (e) {}
}

async function handler(req, res) {
	const debug = req.query?.debug === 'true'

	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	tomorrow.setHours(0, 0, 0, 0)

	console.log(`Today is ${today.toString()}`)
	console.log(`Tomorrow is ${tomorrow.toString()}`)

	// Comics
	const comics = await getAllComics()
	const outComics = comics.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		console.log({
			type: 'comic',
			title: c.title,
			pubDate,
			tomorrow,
			today,
			pubTime: pubDate.getTime(),
			tomTime: tomorrow.getTime(),
			todTime: today.getTime(),
			tomTest: tomorrow.getTime() === pubDate.getTime(),
			todTest: today.getTime() === pubDate.getTime(),
		})
		const test = today.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	if (outComics.length && !debug) {
		const resp = await sendWebhook(process.env.DISCORD_WEBHOOK_COMICS, {
			username: `Comics Releasing (${dateString(today)})`,
			content: outComics.map(processComic).join('\n'),
			avatar_url: 'https://blueharvest.rocks/bots/bh_blue@2x.png',
		})

		if (resp && resp.id && resp.channel_id && resp.author?.bot) {
			await crossPostMessage(resp.channel_id, resp.id)
		}
	}

	// Books
	const books = await getBooks()
	const outBooks = books.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		console.log({
			type: 'book',
			title: c.title,
			pubDate,
			tomorrow,
			today,
			pubTime: pubDate.getTime(),
			tomTime: tomorrow.getTime(),
			todTime: today.getTime(),
			tomTest: tomorrow.getTime() === pubDate.getTime(),
			todTest: today.getTime() === pubDate.getTime(),
		})
		const test = tomorrow.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	if (outBooks.length && !debug) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_BOOKS, {
			username: `Books Releasing (${dateString(today)})`,
			content: outBooks.map(processBook).join('\n'),
			avatar_url: 'https://blueharvest.rocks/bots/bh_red@2x.png',
		})
	}

	// TV
	const tv = await getTV()
	const outTv = tv.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		console.log({
			type: 'tv',
			title: c.title,
			pubDate,
			tomorrow,
			today,
			pubTime: pubDate.getTime(),
			tomTime: tomorrow.getTime(),
			todTime: today.getTime(),
			tomTest: tomorrow.getTime() === pubDate.getTime(),
			todTest: today.getTime() === pubDate.getTime(),
		})
		const test = today.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	if (outTv.length && !debug) {
		spliceIntoChunks(outTv, 4).forEach(async tv => {
			await sendWebhook(process.env.DISCORD_WEBHOOK_TV, {
				username: `TV Shows Premiering (${dateString(today)})`,
				content: tv.map(processTv).join('\n'),
				avatar_url: 'https://blueharvest.rocks/bots/bh_teal@2x.png',
			})
		})
	}

	res.status(200).json({
		success: true,
		bookCount: outBooks.length,
		comicCount: outComics.length,
		tvCount: outTv.length,
	})
}

export default handler

export const config = {
	api: {
		bodyParser: false,
	},
}
