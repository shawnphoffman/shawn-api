import { log } from 'next-axiom'

import { PodFeedConfig } from '@/config/feeds/types'
import { getPodcastFeed, getRssFeed } from '@/getters/rss-feed/recent'
import { postRssBleet } from '@/third-party/bluesky/bluesky-rss'
import { sendNonPodWebhookRaw, sendRssWebhook } from '@/third-party/discord/discord-rss'
import WebhookChannel from '@/third-party/discord/webhookChannels'
import pingOvercast from '@/third-party/notifiers/overcast'
import { pingRefreshUrls } from '@/third-party/notifiers/urls'
import redis, { RedisKey } from '@/utils/redis'

// =================
// RSS FEEDS
// =================

//
// FORMATTERS
//
// const formatNewsForBsky = (newsItem: NewsItem) => {
// 	return `${newsItem.title}

// ${newsItem.desc}

// #StarWars #StarWarsNews`
// }
const createOutput = (items: any[]) => {
	return `<ul>${items.map(c => `<li>⭐ ${c.title}</li>`).join('')}</ul>`
}

//
// PROCESSOR
//
type ProcessItemsProps = { debug: boolean; config: PodFeedConfig }
async function processItems({ debug, config }: ProcessItemsProps) {
	const { feed, items } = await getRssFeed(config.url)

	if (!feed) {
		return `<i>❌ No rss feed found for "${config.url}"</i>`
	}

	console.log(`🎧 Processing RSS feed: ${feed?.title}`)

	if (!items.length) {
		return `<i>No recent items for "${feed.title}"</i>`
	}

	try {
		if (debug) {
			console.log(`🗣️`, feed)
		}
		for (const item of items) {
			if (debug) {
				console.log(`🎙️`, item)
			}

			// Safely extract guid or link, handling both string and object cases
			const getGuidOrLink = (item: any) => {
				if (item.guid) {
					// Handle case where guid might be an object with #text property
					return typeof item.guid === 'string' ? item.guid : item.guid?.['#text'] || item.guid?.toString() || ''
				}
				return item.link || ''
			}

			const redisMember = `${config.event}:${getGuidOrLink(item)}`
			// console.log('redisMember', redisMember)

			const image = item.imageURL || feed.imageURL

			if (debug) {
				continue
			}

			// Post to Discord?
			if (config.channel) {
				const exists = await redis().sismember(RedisKey.RssDiscord, redisMember)
				if (!exists) {
					console.log('    ⚪️ Redis.discord.not.exists', redisMember)
					await sendRssWebhook({ name: config.name, item: item, avatar: image, webhook: config.channel, homepage: config.homepage })
					redis().sadd(RedisKey.RssDiscord, redisMember)
				} else {
					console.log('    🔘 Redis.discord.exists', redisMember)
				}
			}

			// Post to BlueSky?
			if (config.bluesky) {
				const exists = await redis().sismember(RedisKey.RssBluesky, redisMember)
				if (!exists) {
					console.log('    ⚪️ Redis.bluesky.not.exists', redisMember)

					await postRssBleet({
						name: config.name,
						item: item,
						homepage: config.homepage,
						handle: config.bskyHandle,
						hashtags: config.hashtags,
					})

					redis().sadd(RedisKey.RssBluesky, redisMember)
				} else {
					console.log('    🔘 Redis.bluesky.exists', redisMember)
				}
			}

			// Ping Refresh URLs?
			if (config.refreshUrls?.length) {
				const exists = await redis().sismember(RedisKey.RssRefresh, redisMember)
				if (!exists) {
					console.log('    ⚪️ Redis.refresh.not.exists', redisMember)
					await pingRefreshUrls(config.name, config.refreshUrls)
					await sendNonPodWebhookRaw({
						username: 'RSS Refresh URLs',
						webhook: WebhookChannel.ShawnDev,
						content: `Pinging refresh URLs for ${config.name}`,
					})
					redis().sadd(RedisKey.RssRefresh, redisMember)
				} else {
					console.log('    🔘 Redis.refresh.exists', redisMember)
				}
			}
		}
	} catch (error) {
		log.error('Error processing message', error)
	}

	return createOutput(items)
}

export default processItems
