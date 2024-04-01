import podcastFeedParser from '@podverse/podcast-feed-parser'
import { NextResponse } from 'next/server'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

const secondsToDhms = (seconds: number) => {
	seconds = Number(seconds)
	var d = Math.floor(seconds / (3600 * 24))
	var h = Math.floor((seconds % (3600 * 24)) / 3600)
	var m = Math.floor((seconds % 3600) / 60)
	var s = Math.floor(seconds % 60)

	var dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : ''
	var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : ''
	var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : ''
	var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : ''
	return {
		display: dDisplay + hDisplay + mDisplay + sDisplay,
		days: d,
		hours: h,
		minutes: m,
		seconds: s,
	}
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	try {
		const requestOptions = {
			method: 'GET',
		}
		const data = await fetchHtmlWithCache(url, requestOptions, 15)
		const podcast = await podcastFeedParser.getPodcastFromFeed(data)

		const episodes = podcast.episodes
			.map(e => {
				return {
					title: e.title,
					duration: {
						totalSeconds: e.duration,
						...secondsToDhms(e.duration),
					},
					guid: e.guid,
					link: e.link,
					pubDate: e.pubDate,
					imageURL: e.imageURL,
				}
			})
			.sort((a, b) => {
				const aDate = new Date(a.pubDate)
				const bDate = new Date(b.pubDate)
				if (aDate > bDate) return -1
				if (aDate < bDate) return 1
				return 0
			})

		const totalSeconds = episodes.reduce((a, b) => {
			return a + b.duration.totalSeconds
		}, 0)

		return NextResponse.json({
			title: podcast.meta.title,
			total: {
				count: podcast.episodes.length,
				duration: {
					totalSeconds,
					...secondsToDhms(totalSeconds),
				},
			},
			episodes,
			// raw: podcast,
		})
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	}
}
