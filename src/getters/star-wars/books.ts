import * as cheerio from 'cheerio'

// import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

//
// TYPES
//
export type Book = {
	title: string
	author: string
	format?: string
	pubDate: Date
	url?: string
}

const url = 'https://starwars.fandom.com/wiki/List_of_future_books'
const altUrl = 'https://starwars.fandom.com/wiki/Timeline_of_canon_books'
// TODO
// https://starwars.fandom.com/wiki/List_of_novels_by_release_date#2024
// https://youtini.com/all-upcoming-books
// https://youtini.com/release-schedule#recently-released

export const getBooksAlt = async (): Promise<Book[]> => {
	var yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 2)

	// const options = {
	// 	method: 'GET',
	// }
	// const data = await fetchHtmlWithCache({ url: altUrl, options, cacheMinutes: 60 })
	const res = await fetch(altUrl, {
		method: 'GET',
		next: { revalidate: 3600 },
	})
	const data = await res.text()

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

			// Grab the book data
			const comic = {
				title: title,
				type: valueMap[1],
				pubDate: date,
				url: `https://starwars.fandom.com${link}`,
				author: valueMap[3],
			}

			return comic
		})
		.toArray()
		.filter(i => i !== null)
		.sort((a, b) => Number(a.pubDate) - Number(b.pubDate))

	// console.log('-----------------')
	console.log(`ALT BOOK COUNT: ${books.length}`)

	return books
}

export const getBooks = async (): Promise<Book[]> => {
	// const options = {
	// 	method: 'GET',
	// }
	// const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 60 })
	const res = await fetch(url, {
		method: 'GET',
		next: { revalidate: 3600 },
	})
	const data = await res.text()

	const $ = cheerio.load(data)

	// const pageTitle = $('title').text().trim()
	// Print some information to actor log
	// console.log(`TITLE: ${pageTitle}`)

	let prevDate: Date

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

			// Grab the date
			const rawDate = valueMap[3]
			if (rawDate) {
				prevDate = new Date(rawDate)
			}

			// Grab the book data
			const book = {
				title: valueMap[0],
				author: valueMap[1],
				format: valueMap[2],
				pubDate: prevDate,
				url: `https://starwars.fandom.com${link}`,
			}

			//console.log(comic)

			return book
		})
		.toArray()

	// console.log('-----------------')
	console.log(`BOOK COUNT: ${books.length}`)
	// console.log(comics)

	// Return an object with the data extracted from the page.
	// It will be stored to the resulting dataset.
	return books.sort((a, b) => Number(a.pubDate) - Number(b.pubDate))
}

export const getAllBooks = async (): Promise<Book[]> => {
	const promBooks = getBooks()
	const promBooksAlt = getBooksAlt()
	const [books, booksAlt] = await Promise.all([promBooks, promBooksAlt])

	const merged = [...books, ...booksAlt].reduce((memo, el) => {
		memo[el.title] = {
			...memo[el.title],
			...el,
		}
		return memo
	}, {})

	const sorted = Object.values(merged).sort((a: Book, b: Book) => Number(a.pubDate) - Number(b.pubDate)) as Book[]
	return sorted
}
