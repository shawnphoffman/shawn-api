import { getComics } from '../future-comics'
import { getBooks } from '../future-books'
// import { getTV } from './future-tv'
import Cors from 'src/utils/cors'

const processComic = comic => {
	return `
**${comic.title}**
https://starwars.fandom.com${comic.url}`
}

const processBook = book => {
	return `
**${book.title}${book.author ? ` (${book.author})` : ``}**
- Format: ${book.format}
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

	console.log('-----------------')
	console.log('WEBHOOK RESPONSE')
	console.log(`Status: ${response.status}`)
	console.log(`Status Text: ${response.statusText}`)
}

async function handler(req, res) {
	await Cors(req, res, {
		methods: ['POST', 'OPTIONS'],
		// origin: [/shawn\.party$/],
	})

	// Comics
	const comics = await getComics()
	const outComics = [comics[0]]

	if (outComics.length) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_TEMP, {
			username: `TEST Comics Dump`,
			content: outComics.map(processComic).join('\n'),
		})
	}

	// Books
	const books = await getBooks()
	const outBooks = [books[0]]

	if (outBooks) {
		await sendWebhook(process.env.DISCORD_WEBHOOK_TEMP, {
			username: `TEST Books Dump`,
			content: outBooks.map(processBook).join('\n'),
		})
	}

	const response = {
		success: true,
		books: outBooks,
		comics: outComics,
		bookCount: outBooks.length,
		comicCount: outComics.length,
	}
	res.status(200).json(response)
}

export default handler

export const config = {
	api: {
		bodyParser: false,
	},
}
