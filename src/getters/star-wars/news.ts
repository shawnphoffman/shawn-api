import * as cheerio from 'cheerio'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

//
// TYPES
//
export type NewsItem = {
	title: string
	desc: string
	link?: string
	imgSrc: string
}

const url = 'https://www.starwars.com/news'

async function getOfficialNews(): Promise<NewsItem[]> {
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

export const getAllNews = async (): Promise<NewsItem[]> => {
	const promNews = getOfficialNews()
	const [news] = await Promise.all([promNews])
	return news
}
