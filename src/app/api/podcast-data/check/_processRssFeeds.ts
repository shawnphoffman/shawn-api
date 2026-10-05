import { PodFeedConfig } from '@/config/feeds/types'
import { getRssFeed } from '@/getters/rss-feed/recent'
import { postRssBleet } from '@/third-party/bluesky/bluesky-rss'
import { sendNonPodWebhookRaw, sendRssWebhook } from '@/third-party/discord/discord-rss'
import WebhookChannel from '@/third-party/discord/webhookChannels'
import { pingRefreshUrls } from '@/third-party/notifiers/urls'
import { RedisKey } from '@/utils/redis'

import { deliver, FeedResult, markFeedDown, newFeedResult } from './_result'

// =================
// RSS FEEDS
// =================

// Safely extract guid or link, handling both string and object cases
const getGuidOrLink = (item: any) => {
	if (item.guid) {
		// Handle case where guid might be an object with #text property
		return typeof item.guid === 'string' ? item.guid : item.guid?.['#text'] || item.guid?.toString() || ''
	}
	return item.link || ''
}

type ProcessItemsProps = { debug: boolean; config: PodFeedConfig }
async function processItems({ debug, config }: ProcessItemsProps): Promise<FeedResult> {
	const result = newFeedResult(config.name)
	const { feed, items } = await getRssFeed(config.url)

	if (!feed) {
		markFeedDown(result, `No rss feed found for "${config.url}"`)
		return result
	}

	console.log(`🎧 Processing RSS feed: ${feed?.title}`)

	if (debug) {
		console.log(`🗣️`, feed)
	}
	for (const item of items) {
		result.items.push(item.title)
		if (debug) {
			console.log(`🎙️`, item)
			continue
		}

		const redisMember = `${config.event}:${getGuidOrLink(item)}`
		const image = item.imageURL || feed.imageURL

		// Post to Discord?
		if (config.channel) {
			const channel = config.channel
			await deliver(result, 'Discord', RedisKey.RssDiscord, redisMember, () =>
				sendRssWebhook({ name: config.name, item: item, avatar: image, webhook: channel, homepage: config.homepage })
			)
		}

		// Post to BlueSky?
		if (config.bluesky) {
			await deliver(result, 'Bluesky', RedisKey.RssBluesky, redisMember, () =>
				postRssBleet({
					name: config.name,
					item: item,
					homepage: config.homepage,
					handle: config.bskyHandle,
					hashtags: config.hashtags,
				})
			)
		}

		// Ping Refresh URLs?
		if (config.refreshUrls?.length) {
			const refreshUrls = config.refreshUrls
			await deliver(result, 'Refresh URLs', RedisKey.RssRefresh, redisMember, async () => {
				await pingRefreshUrls(config.name, refreshUrls)
				await sendNonPodWebhookRaw({
					username: 'RSS Refresh URLs',
					webhook: WebhookChannel.ShawnDev,
					content: `Pinging refresh URLs for ${config.name}`,
				})
			})
		}
	}

	return result
}

export default processItems
