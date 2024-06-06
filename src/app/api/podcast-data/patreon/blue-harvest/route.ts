import podcastFeedParser from '@podverse/podcast-feed-parser'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

const newUrl = process.env.RSS_BLUE_HARVEST_PATREON

export async function GET() {
	try {
		const options = {
			method: 'GET',
		}
		const data = await fetchHtmlWithCache({ url: newUrl!, options, cacheMinutes: 15 })
		const podcast = await podcastFeedParser.getPodcastFromFeed(data)

		if (!podcast?.episodes) {
			return Response.json({ error: 'No RSS feed found' }, { status: 500 })
		}

		const sorted = podcast.episodes.sort((a, b) => {
			const aDate = new Date(a.pubDate)
			const bDate = new Date(b.pubDate)
			if (aDate > bDate) return -1
			if (aDate < bDate) return 1
			return 0
		})

		const response = sorted.slice(0, 20).map(i => {
			const { guid, title, pubDate, link, description } = i
			return {
				title,
				guid: guid.$t,
				pubDate,
				link,
				description,
			}
		})

		return Response.json(response)
	} catch (error) {
		console.log('Error:', error)
		return Response.json({ error }, { status: 500 })
	}
}

export const dynamic = 'force-dynamic'
