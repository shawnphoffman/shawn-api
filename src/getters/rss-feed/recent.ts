import podcastFeedParser from '@podverse/podcast-feed-parser'
import { XMLParser } from 'fast-xml-parser'

import { ParsedYouTubeRSS, YouTubeRSSEntry } from '@/types/youtube-rss'
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

export type FeedType = {
	title: string
	link: string
	description: string
	imageURL: string
	summary: string
}

export type YouTubeFeedType = {
	title: string
	link: string
}

export type ItemType = {
	title: string
	pubDate: string
	guid: string
	// description: string // This is HTML
	summary: string // This is clean with newlines
	// duration: number
	imageURL: string
	link: string
}

export type YouTubeItemType = {
	title: string
	pubDate: string
	guid: string
	link: string
	imageURL?: string | undefined
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

const options = {
	ignoreAttributes: false,
}

export async function getRssFeed(url: string): Promise<{ feed?: FeedType; items: ItemType[] }> {
	try {
		const res = await fetch(url, {
			method: 'GET',
			// next: { revalidate: 60 }, // 10 minutes
			cache: 'no-store',
		})
		const data = await res.text()
		const parser = new XMLParser(options)
		const rawJson = parser.parse(data)

		const output = {
			feed: {
				title: rawJson.rss.channel.title,
				link: rawJson.rss.channel.link,
				description: rawJson.rss.channel.description,
				imageURL: rawJson.rss.channel.image,
				summary: rawJson.rss.channel.description,
			},
			items: rawJson.rss.channel.item.map((item: any) => {
				// console.log('item', item)
				try {
					return {
						title: item.title,
						pubDate: item.pubDate,
						guid: item.guid['#text'],
						summary: item.description,
						imageURL: item.image || item['media:thumbnail']['@_url'],
						link: item.link,
					}
				} catch (error) {
					return {
						title: item.title,
						pubDate: item.pubDate,
						guid: item.guid,
						summary: item.description,
						// imageURL: item.image || item['media:thumbnail']['@_url'],
						link: item.link,
					}
				}
			}),
		}

		if (!output?.feed?.title || !output?.items?.length) {
			return { feed: output?.feed, items: [] }
		}

		const pastDate = getYesterday()
		// TODO
		if (process.env.NODE_ENV === 'development') {
			pastDate.setDate(pastDate.getDate() - 7)
		} else {
			pastDate.setDate(pastDate.getDate() - 7)
		}
		output.items = output.items.filter(item => {
			return cleanDate(item.pubDate) >= pastDate
		})

		// console.log('filtered', output.items)

		return output
	} catch (error) {
		console.error('Error:', error)
		return { items: [] }
	}
}

export async function getYouTubeFeed(url: string): Promise<{ feed?: YouTubeFeedType; items: YouTubeItemType[] }> {
	try {
		const res = await fetch(url, {
			method: 'GET',
			// next: { revalidate: 60 }, // 10 minutes
			cache: 'no-store',
		})
		const data = await res.text()
		const parser = new XMLParser(options)
		const rawJson: ParsedYouTubeRSS = parser.parse(data)

		// console.log('rawJson', rawJson)

		const output = {
			feed: {
				title: rawJson.feed.title,
				link: rawJson.feed.author.uri,
			},
			items: rawJson.feed.entry.map((item: YouTubeRSSEntry) => {
				// console.log('item', item)
				try {
					return {
						title: item.title,
						guid: item['yt:videoId'],
						link: item.link?.['@_href'],
						pubDate: item.published,
						// summary: item['media:group']?.['media:description'],
						imageURL: item['media:group']?.['media:thumbnail']['@_url'],
					}
				} catch (error) {
					return {
						title: item.title,
						guid: item['yt:videoId'],
						link: item.link?.['@_href'],
						pubDate: item.published,
					}
				}
			}),
		}

		// console.log('output', output)

		if (!output?.feed?.title || !output?.items?.length) {
			return { feed: output?.feed, items: [] }
		}

		const pastDate = getYesterday()
		// TODO
		if (process.env.NODE_ENV === 'development') {
			pastDate.setDate(pastDate.getDate() - 2)
		} else {
			pastDate.setDate(pastDate.getDate() - 2)
		}
		output.items = output.items.filter(item => {
			return cleanDate(item.pubDate) >= pastDate
		})

		// console.log('filtered', output.items)

		return output
	} catch (error) {
		console.error('Error:', error)
		return { items: [] }
	}
}
