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
// PODCASTS
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

			const redisMember = `${config.event}:${item.guid || item.link}`

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

			// Ping Overcast?
			if (config.ping !== false) {
				const exists = await redis().sismember(RedisKey.RssOvercast, redisMember)
				if (!exists) {
					console.log('    ⚪️ Redis.overcast.not.exists', redisMember)
					await pingOvercast(config.url)
					redis().sadd(RedisKey.RssOvercast, redisMember)
				} else {
					console.log('    🔘 Redis.overcast.exists', redisMember)
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
