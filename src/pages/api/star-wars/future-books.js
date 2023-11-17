import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import * as cheerio from 'cheerio'

const url = 'https://starwars.fandom.com/wiki/List_of_future_books'
const altUrl = 'https://starwars.fandom.com/wiki/Timeline_of_canon_books'

const getBooksAlt = async () => {
	var yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 2)

	const requestOptions = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache(altUrl, requestOptions, 15)

	const $ = cheerio.load(data)

	const books = $('table.wikitable tbody tr')
		.map(function (i) {
			if (i === 0) return null

			const valueMap = $(this)
				.find('td')
				.map(function (j, td) {
					return $(td).text().trim()
				})

			// Grab a link to the book
			const linkObj = $($(this).find('td')[2]).find('a:first')
			const title = linkObj.text().trim() || $($(this).find('td')[2]).find('span').text().trim()
			const link = linkObj.prop('href')

			const rawDate = valueMap[4]
			if (!rawDate) {
				// console.log(`missing date: ${i} ${rawDate} - ${title}`)
				return null
			}

			const date = new Date(rawDate)
			if (date < yesterday) {
				return null
			}

			// Grab the comic data
			const comic = {
				title: title,
				type: valueMap[1],
				pubDate: date,
				url: link,
				author: valueMap[3],
			}

			return comic
		})
		.toArray()
		.filter(i => i !== null)
		.sort((a, b) => a.pubDate - b.pubDate)

	console.log('-----------------')
	console.log(`ALT BOOK COUNT: ${books.length}`)

	return books
}

export async function getBooks() {
	const requestOptions = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache(url, requestOptions, 15)

	const $ = cheerio.load(data)

	const pageTitle = $('title').text().trim()

	// Print some information to actor log
	console.log(`TITLE: ${pageTitle}`)

	// Retrieve the books
	const books = $('table:last tr')
		.map(function (i) {
			// Skip header
			if (i === 0) return

			// Grab the row values
			const valueMap = $(this)
				.find('td')
				.map(function (j, td) {
					return $(td).text().trim()
				})

			// Grab a link to the book
			const link = $(this).find('a:first').prop('href')

			// Grab the book data
			const book = {
				title: valueMap[0],
				author: valueMap[1],
				format: valueMap[2],
				pubDate: new Date(valueMap[3]),
				url: link,
			}

			//console.log(comic)

			return book
		})
		.toArray()

	console.log('-----------------')
	console.log(`BOOK COUNT: ${books.length}`)
	// console.log(comics)

	// Return an object with the data extracted from the page.
	// It will be stored to the resulting dataset.
	return books.sort((a, b) => a.pubDate - b.pubDate)
}

export default async function handler(req, res) {
	const response = await getBooks()
	const response2 = await getBooksAlt()

	const alt = [...response2, ...response].reduce((memo, el) => {
		// if (memo[el.title]) {

		// }
		memo[el.title] = {
			...memo[el.title],
			...el,
		}
		return memo
	}, {})

	const temp = Object.values(alt).sort((a, b) => a.pubDate - b.pubDate)

	res.status(200).send(temp)
}
