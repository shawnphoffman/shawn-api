import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import * as cheerio from 'cheerio'

const url = 'https://starwars.fandom.com/wiki/List_of_future_comics'

export default async function handler(req, res) {
	const requestOptions = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache(url, requestOptions, 60 * 24)

	const $ = cheerio.load(data)

	const pageTitle = $('title').text().trim()

	// Print some information to actor log
	console.log(`TITLE: ${pageTitle}`)

	// Retrieve the comics
	const comics = $('table:last tr')
		.map(function (i) {
			// Skip header
			if (i === 0) return

			// Grab the row values
			const valueMap = $(this)
				.find('td')
				.map(function (j, td) {
					return $(td).text().trim()
				})

			// Grab a link to the comic
			const link = $(this).find('a:first').prop('href')

			// Grab the comic data
			const comic = {
				title: valueMap[0],
				type: valueMap[1],
				pubDate: new Date(valueMap[2]),
				url: link,
			}

			//console.log(comic)

			return comic
		})
		.toArray()

	console.log(`COMIC COUNT: ${comics.length}`)

	// Return an object with the data extracted from the page.
	// It will be stored to the resulting dataset.
	const response = comics.sort((a, b) => a.pubDate - b.pubDate)

	res.status(200).send(response)
}
