import * as cheerio from 'cheerio'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

//
// TYPES
//
export type Comic = {
	title: string
	type: string
	pubDate: Date
	url: string
}

// TODO - Standardize "type" field

const url = 'https://starwars.fandom.com/wiki/List_of_future_comics'
const altUrl = 'https://starwars.fandom.com/wiki/Timeline_of_canon_comics'

const getComicsAlt = async (): Promise<Comic[]> => {
	var yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 4)

	const options = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache({ url: altUrl, options, cacheMinutes: 30 })

	const $ = cheerio.load(data)

	const comics = $('table.wikitable tbody tr')
		.map(function (i) {
			if (i === 0) return null

			const valueMap = $(this)
				.find('td')
				.map(function (j, td) {
					return $(td).text().trim()
				})

			// Grab a link to the comic
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
				url: `https://starwars.fandom.com${link}`,
				author: valueMap[3],
			}

			return comic
		})
		.toArray()
		.filter(i => i !== null)
		.sort((a, b) => Number(a.pubDate) - Number(b.pubDate)) as Comic[]

	// console.log('-----------------')
	console.log(`ALT COMIC COUNT: ${comics.length}`)

	return comics
}

const getComics = async (): Promise<Comic[]> => {
	const options = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 30 })

	const $ = cheerio.load(data)

	// const pageTitle = $('title').text().trim()
	// Print some information to actor log
	// console.log(`TITLE: ${pageTitle}`)

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
				url: `https://starwars.fandom.com${link}`,
			}

			//console.log(comic)

			return comic
		})
		.toArray()

	// console.log('-----------------')
	console.log(`COMIC COUNT: ${comics.length}`)

	// Return an object with the data extracted from the page.
	// It will be stored to the resulting dataset.
	const response = comics.sort((a, b) => Number(a.pubDate) - Number(b.pubDate)) as Comic[]

	return response
}

export const getAllComics = async (): Promise<Comic[]> => {
	const promComics = getComics()
	const promComicsAlt = getComicsAlt()
	const [comics, comicsAlt] = await Promise.all([promComics, promComicsAlt])

	const merged = [...comics, ...comicsAlt].reduce((memo, el) => {
		memo[el.title] = {
			...memo[el.title],
			...el,
		}
		return memo
	}, {})

	const sorted = Object.values(merged).sort((a: Comic, b: Comic) => Number(a.pubDate) - Number(b.pubDate)) as Comic[]
	return sorted
}
