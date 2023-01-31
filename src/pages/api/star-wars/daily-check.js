// import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
// import * as cheerio from 'cheerio'
import { verifySignature } from '@upstash/qstash/nextjs'
import { getComics } from './future-comics'
import { getBooks } from './future-books'
// import { getTV } from './future-tv'

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
	const today = new Date().setHours(0, 0, 0, 0)

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

	// Books
	const books = await getBooks()
	const todayBooks = books.filter(c => {
		const pubDate = new Date(c.pubDate).setHours(0, 0, 0, 0)
		return today === pubDate
	})

	await sendWebhook(process.env.DISCORD_WEBHOOK_BOOKS, {
		username: 'Books Releasing Today',
		content: todayBooks.map(processBook).join('\n'),
	})

	res.status(200).json({ success: true })
}

const isLocal = process.env.LOCAL || false

export default isLocal ? handler : verifySignature(handler)

export const config = {
	api: {
		bodyParser: false,
	},
}
