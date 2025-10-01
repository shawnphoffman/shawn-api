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

	// console.log('getOfficialNews.data', data)

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
	console.log(`OFFICIAL NEWS COUNT: ${newsItems.length}`)

	return newsItems
}

async function getFriendNews(): Promise<NewsItem[]> {
	// https://theroguerebels.com/feed/
	return []
}

export async function getYoutiniNews(): Promise<NewsItem[]> {
	console.log('getYoutiniNews.start')

	const url = 'https://youtini.com/articles'
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
		console.error('getYoutiniNews.error', error)
		return []
	}

	if (!data) {
		console.error('getYoutiniNews.noData')
		return []
	}

	// console.log('getYoutiniNews.data', data)

	const $ = cheerio.load(data)

	// Retrieve the primary news section
	// const newsItems = $('.blocks-list-view li')
	const newsItems: NewsItem[] = $('[data-framer-name="Full  / Desktop"]')
		.map(function () {
			const textContainerChildren = $(this).find('a').eq(2).find('div')
			const title = textContainerChildren.first().text().trim()
			const audioIcon = $(this).find('[data-framer-name="audio icon"]').first()
			if (audioIcon.length) {
				console.log('    🙈 Ignoring youtiniaudio news item', title)
				return null
			}
			const desc = textContainerChildren.last().text().trim()
			const link = $(this).find('a').first().prop('href')
			let imgSrc: string | null = null
			const img = $(this).find('img').first()
			if (img.length) {
				imgSrc = img.attr('src') || null
				if (!imgSrc) {
					const srcset = img.attr('srcset')
					if (srcset) {
						// srcset is a comma-separated list of "url size"
						const firstSrc = srcset.split(',')[0].trim().split(' ')[0]
						imgSrc = firstSrc
					}
				}
			}

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
			} as NewsItem
		})
		.toArray()
		.filter(Boolean)

	// console.log('-----------------')
	console.log(`    YOUTININEWS COUNT: ${newsItems.length}`)

	// Remove duplicates based on link property while preserving order
	const seenLinks = new Set<string>()
	const deduplicatedNews = newsItems.filter(item => {
		if (!item.link) {
			// Keep items without links
			return true
		}
		if (seenLinks.has(item.link)) {
			return false
		}
		seenLinks.add(item.link)
		return true
	})

	console.log(`    DEDUPLICATED YOUTININ NEWS COUNT: ${deduplicatedNews.length}`)

	return deduplicatedNews
}

export const getAllNews = async (): Promise<NewsItem[]> => {
	const promNews = getOfficialNews()
	const [news] = await Promise.all([promNews])
	return news
}
