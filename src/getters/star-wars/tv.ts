import * as cheerio from 'cheerio'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

//
// TYPES
//
export type TvShow = {
	series: string
	title: string
	episode: string
	pubDate: Date
	pubString: string
	url: string
}

const rootUrl = 'https://thetvdb.com'
const listUrl = `${rootUrl}/lists/13864`

const options = {
	method: 'GET',
}

const fetchChild = async (childUrl: string): Promise<TvShow[]> => {
	const url = `https://thetvdb.com${childUrl}/allseasons/official`

	const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 15 })
	const $ = cheerio.load(data)

	const seriesTitle = $('.crumbs a:nth-child(3)').text().trim()

	// Retrieve the episodes
	const episodes = $('ul.list-group li.list-group-item')
		.map(function () {
			// Check to see if there are valid episodes
			const hasPubDate = $(this).find('.list-inline li').length > 1
			if (!hasPubDate) {
				return
			}

			// Get the properties
			const epNum = $(this).find('.episode-label').text().trim()
			const pubDate = $(this).find('.list-inline li:first').text().trim()
			const title = $(this).find('h4 a').text().trim()

			// Grab a link to the episode
			const link = $(this).find('h4 a').prop('href')

			// console.log(``);
			// console.log(`----`);
			// console.log(`episode: ${epNum}`);
			// console.log(`date: ${pubDate}`);
			// console.log(`title: ${title}`);
			// console.log(`link: ${link}`);

			// if (new Date(new Date(pubDate).toDateString()) < new Date(new Date().toDateString())) {
			// 	return
			// }

			// Grab the episode data
			const episode = {
				series: seriesTitle,
				title: title,
				episode: epNum,
				pubDate: new Date(pubDate),
				pubString: pubDate,
				url: `${rootUrl}${link}`,
			}

			return episode
		})
		.toArray()

	// console.log(`EPISODE COUNT: ${episodes.length}`);
	// console.log(episodes);

	return episodes
}

export async function getTv(): Promise<TvShow[]> {
	// Response is an array of future TV episodes
	let response: TvShow[] = []
	const data = await fetchHtmlWithCache({ url: listUrl, options, cacheMinutes: 15 })

	const $ = cheerio.load(data)

	// Process Root URL and build our child URLS
	// const pageTitle = $('h1').text().trim()

	// console.log(`List: ${pageTitle}`);
	const children = $('h3 a')
		.map((i, a) => {
			return $(a).prop('href')
		})
		.toArray()

	// console.log("Series URLS:\n");
	// console.log(children.join("\n"));

	// console.log("LOOPING 1");

	// Process child URLs
	await Promise.all(
		children.map(async c => {
			// console.log("resp1", response);
			response = [...(await fetchChild(c)), ...response]
			// console.log("resp2", response);
		})
	)

	// console.log("RETURNING");

	var yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 2)

	const filtered = response.filter(r => r.pubDate > yesterday)

	return filtered.sort((a, b) => Number(a.pubDate) - Number(b.pubDate))
}

export const getAllTv = async (): Promise<TvShow[]> => {
	const promTv = getTv()
	const [tv] = await Promise.all([promTv])
	return tv
}
