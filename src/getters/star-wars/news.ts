import * as cheerio from 'cheerio'

const UserAgents = {
	FacebookBot: 'facebookexternalhit/1.1',
	Generic: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
	GoogleBot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
}

// import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

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
	console.log('getOfficialNews.start')

	let data = ''

	try {
		const res = await fetch(url, {
			method: 'GET',
			// next: { revalidate: 900 },
			// headers: {
			// 	'User-Agent': UserAgents.GoogleBot,
			// },
		})
		data = await res.text()
	} catch (error) {
		console.error('getOfficialNews.error', error)
		return []
	}

	if (!data) {
		console.error('getOfficialNews.noData')
		return []
	}

	console.log('getOfficialNews.data', data)

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

	// console.log('-----------------')
	console.log(`NEWS COUNT: ${newsItems.length}`)

	return newsItems
}

async function getFriendNews(): Promise<NewsItem[]> {
	// https://theroguerebels.com/feed/
	return []
}

export const getAllNews = async (): Promise<NewsItem[]> => {
	const promNews = getOfficialNews()
	const [news] = await Promise.all([promNews])
	return news
}
