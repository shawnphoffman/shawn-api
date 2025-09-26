import { YouTubeItemType } from '@/getters/rss-feed/recent'
import { DiscordWebhookConfig } from '@/third-party/discord/webhookChannels'

// import FeedItem from '../rss-feed-emitter/FeedItem'

export type FeedConfig = {
	name: string
	url: string
	event: string
	channel?: DiscordWebhookConfig
	bluesky: boolean
	bskyHandle?: string[]
	homepage?: string
	hashtags?: string[]
}

export interface PodFeedConfig extends FeedConfig {
	refreshUrls?: string[]
	ping?: boolean
}
export interface MiscFeedConfig extends FeedConfig {
	// callback?: (item: FeedItem) => Promise<void>
}
export interface RssFeedConfig extends FeedConfig {
	// callback?: (item: FeedItem) => Promise<void>
}
export interface YouTubeFeedConfig extends FeedConfig {
	isValid?: (item: YouTubeItemType) => boolean
}
