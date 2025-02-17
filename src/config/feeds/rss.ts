import WebhookChannel from '@/third-party/discord/webhookChannels'

import type { RssFeedConfig } from './types'

export const rssFeeds: RssFeedConfig[] = [
	{
		name: 'Rogue Rebels Blog',
		url: 'https://theroguerebels.com/feed',
		event: 'rogue-rebels-blog',
		channel: WebhookChannel.Friends,
		bluesky: true,
		homepage: 'https://theroguerebels.com/',
		bskyHandle: ['theroguerebels.com'],
		hashtags: ['#StarWars', '#RogueRebels'],
	},
]
