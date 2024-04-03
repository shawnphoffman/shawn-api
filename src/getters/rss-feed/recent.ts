import podcastFeedParser from '@podverse/podcast-feed-parser'

import { cleanDate, getYesterday } from '@/utils/dates'
import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

export async function getPodcastFeed(url: string): Promise<{ meta?: any; episodes: any[] }> {
	try {
		const options = {
			method: 'GET',
		}
		const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 15 })
		const podcast = await podcastFeedParser.getPodcastFromFeed(data)

		if (!podcast?.meta || !podcast?.episodes) {
			return { meta: podcast?.meta, episodes: [] }
		}

		const pastDate = getYesterday()
		// TODO
		// pastDate.setDate(pastDate.getDate() - 7)
		const filtered = podcast.episodes.filter(ep => {
			return cleanDate(ep.pubDate) >= pastDate
		})

		const sortedDesc = filtered.sort((a, b) => {
			const aDate = new Date(a.pubDate)
			const bDate = new Date(b.pubDate)
			if (aDate > bDate) return -1
			if (aDate < bDate) return 1
			return 0
		})

		// // TODO Should I do this at all?
		// const response = sortedDesc.map((ep: any) => {
		// 	const { guid, title, pubDate, link } = ep
		// 	return {
		// 		title,
		// 		guid,
		// 		pubDate,
		// 		link,
		// 		rest: ep,
		// 	}
		// })

		return {
			meta: podcast?.meta,
			episodes: sortedDesc,
		}
	} catch (error) {
		console.error('Error:', error)
		return { episodes: [] }
	}
}
