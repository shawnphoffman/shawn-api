import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import * as cheerio from 'cheerio'

/**
 * const list = $('.blocks-list-view li')
 * let title = $(second).find('h3').first().text().trim()
 * let desc = $(second).find('h2').first().text().trim()
 * let link = $(second).find('a').first().prop('href')
 * let imgSrc = $(second).find('img').first().prop('src')
 */

const url = 'https://www.starwars.com/news'

export async function getNews() {
	const requestOptions = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache(url, requestOptions, 15)

	const $ = cheerio.load(data)

	// Retrieve the primary news section
	const newsItems = $('.blocks-list-view li')
		.map(function () {
			const title = $(this).find('h3').first().text().trim()
			const desc = $(this).find('h2').first().text().trim()
			const link = $(this).find('a').first().prop('href')
			let imgSrc = $(this).find('img').first().prop('data-src')

			if (imgSrc) {
				const url = new URL(imgSrc)
				url.search = ''
				imgSrc = url.toString()
			}

			return {
				title,
				desc,
				link,
				imgSrc,
			}
		})
		.toArray()

	console.log('-----------------')
	console.log(`NEWS COUNT: ${newsItems.length}`)

	return newsItems
}

export default async function handler(req, res) {
	const response = await getNews()

	res.status(200).send(response)
}
