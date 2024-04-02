import { AppBskyFeedPost } from '@atproto/api'

import FeedItem from '../rss-feed-emitter/FeedItem'

type DiscordWebhookConfig = {
	id: string
	token: string
}

type FeedConfig = {
	name: string
	url: string
	event: string
	refresh: number
	channel?: DiscordWebhookConfig
	bluesky: boolean
	bskyHandle?: string[]
	homepage?: string
	hashtags?: string[]
}

interface PodFeedConfig extends FeedConfig {
	refreshUrls?: string[]
	ping?: boolean
}
interface MiscFeedConfig extends FeedConfig {
	callback?: (item: FeedItem) => Promise<void>
}
interface YouTubeFeedConfig extends FeedConfig {}

type YouTubeSourceType = {
	[key: string]: {
		channelId: string
		rssFeed?: string
	}
}

type BleetResponse = Partial<AppBskyFeedPost.Record> & Omit<AppBskyFeedPost.Record, 'createdAt'>
interface BleetArgs {
	name: string
	item: Partial<FeedItem>
	homepage?: string
	imageOverride?: string
	handle?: string[]
	hashtags?: string[]
}

interface ImageBlob {
	$type: 'blob'
	ref: {
		$link: string
	}
	mimeType: 'image/jpeg'
	size: number
}
