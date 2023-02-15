import { getComics } from './future-comics'
import { getBooks } from './future-books'
import { getTV } from './future-tv'

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
	const cleanDate = new Date(tv.pubDate).getTime() / 1000
	return `
**${tv.series} (${tv.episode})**
- *Title:* ${tv.title}
- *Release Date*: <t:${cleanDate}:d>
- *Link:* ${tv.url}`
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
	// const today = new Date().setDate(1).setHours(0, 0, 0, 0)
	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	tomorrow.setHours(0, 0, 0, 0)

	// Comics
	const comics = await getComics()
	const outComics = comics.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		const test = tomorrow.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	if (outComics.length) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_COMICS, {
			username: `Comics Releasing (${dateString(tomorrow)})`,
			content: outComics.map(processComic).join('\n'),
			avatar_url: 'https://blueharvest.rocks/bots/bh_blue@2x.png',
		})
	}

	// Books
	const books = await getBooks()
	const outBooks = books.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		const test = tomorrow.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	if (outBooks.length) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_BOOKS, {
			username: `Books Releasing (${dateString(tomorrow)})`,
			content: outBooks.map(processBook).join('\n'),
			avatar_url: 'https://blueharvest.rocks/bots/bh_red@2x.png',
		})
	}

	// TV
	const tv = await getTV()
	const outTv = tv.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		const test = tomorrow.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	if (outTv.length) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_TV, {
			username: `TV Shows Premiering (${dateString(tomorrow)})`,
			content: outTv.map(processTv).join('\n'),
			avatar_url: 'https://blueharvest.rocks/bots/bh_teal@2x.png',
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
