import WebhookChannel from '@/third-party/discord/webhookChannels'

import type { YouTubeFeedConfig } from './types'
import { YouTubeItemType } from '@/getters/rss-feed/recent'

type YouTubeSource = {
	channelId: string
	rssFeed: string
}

const createYouTubeSource = (channelId: string): YouTubeSource => ({
	channelId,
	get rssFeed() {
		return `https://www.youtube.com/feeds/videos.xml?channel_id=${this.channelId}`
	},
})

export const YouTubeSource = {
	BlueHarvest: createYouTubeSource('UCnVaIQi3WprpT-2AHsOJbKg'),
	SteeleWars: createYouTubeSource('UCxnEDVUZe8-j61nKo4HzOYg'),
	StarWarsExplained: createYouTubeSource('UCIKlsX1qfGqKPt4KAW-JOZg'),
	SithList: createYouTubeSource('UC-WaYsQiHNrRGLXGHnL1Fuw'),
	StarWarsSpeltOut: createYouTubeSource('UCsgw0WcCmz2UT1tSpZnGmpA'),
	StarWarsYouTube: createYouTubeSource('UCZGYJFUizSax-yElQaFDp5Q'),
} as const

export const youtubeFeeds: YouTubeFeedConfig[] = [
	{
		name: 'Blue Harvest YouTube',
		url: YouTubeSource.BlueHarvest.rssFeed,
		event: 'blue-harvest-youtube',
		channel: WebhookChannel.YouTube,
		bluesky: false,
		bskyHandle: ['blueharvest.bsky.social'],
		homepage: 'https://blueharvest.rocks',
		// hashtags: ['#StarWars', '#BlueHarvest'],
	},
	{
		name: 'Steele Wars YouTube',
		url: YouTubeSource.SteeleWars.rssFeed,
		event: 'steele-wars-youtube',
		channel: WebhookChannel.Friends,
		bluesky: true,
		bskyHandle: ['steelewars.bsky.social'],
		homepage: 'http://steelewars.com',
		hashtags: ['#StarWars', '#SteeleWars'],
	},
	{
		name: 'Star Wars Explained YouTube',
		url: YouTubeSource.StarWarsExplained.rssFeed,
		event: 'sw-explained-youtube',
		bluesky: true,
		bskyHandle: ['starwarsexplained.com'],
		hashtags: ['#StarWars', '#StarWarsExplained'],
	},
	{
		name: 'Sith List YouTube',
		url: YouTubeSource.SithList.rssFeed,
		event: 'sith-list-youtube',
		channel: WebhookChannel.Friends,
		bluesky: true,
		bskyHandle: ['sithlist.bsky.social'],
		homepage: 'https://sithlist.com/',
		hashtags: ['#StarWars', '#SithList'],
		isValid: (item: YouTubeItemType) => {
			return item.title.toLowerCase().includes('star wars')
		},
	},
	{
		name: 'Star Wars YouTube',
		url: YouTubeSource.StarWarsYouTube.rssFeed,
		event: 'star-wars-youtube',
		channel: WebhookChannel.Friends,
		bluesky: true,
		// bskyHandle: ['sithlist.bsky.social'],
		homepage: 'https://starwars.com/',
		hashtags: ['#StarWars'],
	},
	// {
	// 	name: 'Star Wars Spelt Out YouTube',
	// 	url: YouTubeSource.StarWarsSpeltOut.rssFeed,
	// 	event: 'spelt-out-youtube',
	// 	bluesky: true,
	// 	bskyHandle: ['starwarsspeltout.bsky.social'],
	// 	hashtags: ['#StarWars', '#StarWarsSpeltOut'],
	// },
]
