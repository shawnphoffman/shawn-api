// import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
// import * as cheerio from 'cheerio'
import { verifySignature } from '@upstash/qstash/nextjs'
import { getComics } from './future-comics'
import { getBooks } from './future-books'
// import { getTV } from './future-tv'

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

export async function sendWebhook(url, content) {
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
	// const today = new Date().setDate(1).setHours(0, 0, 0, 0)
	var tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)

	// Comics
	const comics = await getComics()
	const outComics = comics.filter(c => {
		const pubDate = new Date(c.pubDate).setHours(0, 0, 0, 0)
		return tomorrow === pubDate
		// return today === pubDate
	})

	if (outComics.length) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_COMICS, {
			username: `Comics Releasing (${dateString(tomorrow)})`,
			content: outComics.map(processComic).join('\n'),
		})
	}

	// Books
	const books = await getBooks()
	const outBooks = books.filter(c => {
		const pubDate = new Date(c.pubDate).setHours(0, 0, 0, 0)
		return tomorrow === pubDate
		// return today === pubDate
	})

	if (outBooks) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_BOOKS, {
			username: `Books Releasing (${dateString(tomorrow)})`,
			content: outBooks.map(processBook).join('\n'),
		})
	}

	res.status(200).json({ success: true, bookCount: outBooks.length, comicCount: outComics.length })
}

const isLocal = process.env.LOCAL || false

export default isLocal ? handler : verifySignature(handler)

export const config = {
	api: {
		bodyParser: false,
	},
}
