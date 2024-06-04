import { log } from 'next-axiom'

import { PodFeedConfig } from '@/config/feeds/types'
import { getPodcastFeed } from '@/getters/rss-feed/recent'
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
const createOutput = (episodes: any[]) => {
	return `<ul>${episodes.map(c => `⭐ ${c.title}`).join('')}</ul>`
}

//
// PROCESSOR
//
type ProcessItemsProps = { debug: boolean; config: PodFeedConfig }
async function processItems({ debug, config }: ProcessItemsProps) {
	const { meta: podcast, episodes } = await getPodcastFeed(config.url)

	if (!podcast) {
		return `<i>❌ No podcast feed found for "${config.url}"</i>`
	}

	console.log(`🎧 Processing podcast: ${podcast?.title}`)

	if (!episodes.length) {
		return `<i>No recent episodes for "${podcast.title}"</i>`
	}

	try {
		if (debug) {
			console.log(`🗣️`, podcast)
		}
		for (const episode of episodes) {
			if (debug) {
				console.log(`🎙️`, episode)
			}

			const redisMember = `${config.event}:${episode.guid || episode.link}`

			const image = episode.imageURL || podcast.imageURL

			if (debug) {
				continue
			}

			// Post to Discord?
			if (config.channel) {
				const exists = await redis.sismember(RedisKey.RssDiscord, redisMember)
				if (!exists) {
					console.log('    ⚪️ Redis.discord.not.exists', redisMember)
					await sendRssWebhook({ name: config.name, item: episode, avatar: image, webhook: config.channel, homepage: config.homepage })
					redis.sadd(RedisKey.RssDiscord, redisMember)
				} else {
					console.log('    🔘 Redis.discord.exists', redisMember)
				}
			}

			// Post to BlueSky?
			if (config.bluesky) {
				const exists = await redis.sismember(RedisKey.RssBluesky, redisMember)
				if (!exists) {
					console.log('    ⚪️ Redis.bluesky.not.exists', redisMember)

					await postRssBleet({
						name: config.name,
						item: episode,
						homepage: config.homepage,
						handle: config.bskyHandle,
						hashtags: config.hashtags,
					})

					redis.sadd(RedisKey.RssBluesky, redisMember)
				} else {
					console.log('    🔘 Redis.bluesky.exists', redisMember)
				}
			}

			// Ping Overcast?
			if (config.refreshUrls?.length && config.ping !== false) {
				const exists = await redis.sismember(RedisKey.RssOvercast, redisMember)
				if (!exists) {
					console.log('    ⚪️ Redis.overcast.not.exists', redisMember)

					await pingOvercast(config.url)
					await pingRefreshUrls(config.name, config.refreshUrls)
					await sendNonPodWebhookRaw({
						username: 'RSS Refresh URLs',
						webhook: WebhookChannel.ShawnDev,
						content: `Pinging refresh URLs for ${config.name}`,
					})

					redis.sadd(RedisKey.RssOvercast, redisMember)
				} else {
					console.log('    🔘 Redis.overcast.exists', redisMember)
				}
			}

			// // Ping Refresh URLs?
			// if (config.refreshUrls?.length) {
			// 	await pingRefreshUrls(config.name, config.refreshUrls)
			// 	await sendNonPodWebhookRaw({
			// 		username: 'RSS Refresh URLs',
			// 		webhook: WebhookChannel.ShawnDev,
			// 		content: `Pinging refresh URLs for ${config.name}`,
			// 	})
			// }
		}
	} catch (error) {
		log.error('Error processing message', error)
	}

	return createOutput(episodes)
}

export default processItems
