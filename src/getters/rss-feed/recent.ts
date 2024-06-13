import podcastFeedParser from '@podverse/podcast-feed-parser'

import { cleanDate, getYesterday } from '@/utils/dates'

export type PodcastType = {
	title: string
	link: string
	description: string
	imageURL: string
	summary: string
}

export type EpisodeType = {
	title: string
	pubDate: string
	guid: string
	// description: string // This is HTML
	summary: string // This is clean with newlines
	// duration: number
	imageURL: string
	link: string
}

export async function getPodcastFeed(url: string): Promise<{ meta?: PodcastType; episodes: EpisodeType[] }> {
	try {
		const res = await fetch(url, {
			method: 'GET',
			// next: { revalidate: 60 }, // 10 minutes
			cache: 'no-store',
		})
		const data = await res.text()
		const podcast = await podcastFeedParser.getPodcastFromFeed(data)

		if (!podcast?.meta || !podcast?.episodes) {
			return { meta: podcast?.meta, episodes: [] }
		}

		const pastDate = getYesterday()
		// TODO
		if (process.env.NODE_ENV === 'development') {
			pastDate.setDate(pastDate.getDate() - 7)
		} else {
			pastDate.setDate(pastDate.getDate() - 7)
		}
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
