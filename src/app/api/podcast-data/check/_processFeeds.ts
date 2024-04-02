import { log } from 'next-axiom'

import { PodFeedConfig } from '@/config/feeds/types'
import { getPodcastFeed } from '@/getters/rss-feed/recent'
// import { postBleet } from '@/third-party/bluesky/bluesky-rss'
// import { sendWebhook } from '@/third-party/discord/discord-rss'
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
	return episodes.map(c => `    ⭐ ${c.title}`).join('\n')
}

//
// PROCESSOR
//
type ProcessItemsProps = { debug: boolean; config: PodFeedConfig }
async function processItems({ debug, config }: ProcessItemsProps) {
	const { meta: podcast, episodes } = await getPodcastFeed(config.url)

	if (!podcast) {
		return `❌ No podcast feed found for "${config.url}"`
	}

	console.log(`🎧 Processing podcast: ${podcast?.title}`)

	if (!episodes.length) {
		return `    - No recent episodes for "${podcast.title}"`
	}

	try {
		for (const episode of episodes) {
			// if (debug) {
			// 	console.log(`🎙️`, episode)
			// }

			const redisMember = `${config.event}:${episode.guid || episode.link}`

			// const image = episode.imageURL

			if (debug) {
				continue
			}

			// Post to Discord?
			if (config.channel) {
				const exists = await redis.sismember(RedisKey.TestDiscord, redisMember)
				if (!exists) {
					console.log('+ Redis.discord.not.exists', redisMember)
					// await sendWebhook(config.name, episode, image, config.channel, config.homepage)
					redis.sadd(RedisKey.TestDiscord, redisMember)
				} else {
					console.log('+ Redis.discord.exists', redisMember)
				}
			}

			// Post to BlueSky?
			if (config.bluesky) {
				const exists = await redis.sismember(RedisKey.TestBluesky, redisMember)
				if (!exists) {
					console.log('+ Redis.bluesky.not.exists', redisMember)
					// postBleet({ name: config.name, item: episode, homepage: config.homepage, handle: config.bskyHandle, hashtags: config.hashtags })
					redis.sadd(RedisKey.TestBluesky, redisMember)
				} else {
					console.log('+ Redis.bluesky.exists', redisMember)
				}
			}

			// Ping Overcast?
			if (config.ping !== false) {
				const exists = await redis.sismember(RedisKey.TestOvercast, redisMember)
				if (!exists) {
					console.log('+ Redis.overcast.not.exists', redisMember)
					// pingOvercast(feed.url)
					redis.sadd(RedisKey.TestOvercast, redisMember)
				} else {
					console.log('+ Redis.overcast.exists', redisMember)
				}
			}

			// // Ping Refresh URLs?
			// if (feed.refreshUrls?.length > 0) {
			// 	pingRefreshUrl(name, feed.refreshUrls)
			// 	sendNonPodWebhookRaw('RSS Refresh URLs', WebhookChannel.ShawnDev, `Pinging refresh URLs for ${name}`)
			// }
		}
	} catch (error) {
		log.error('Error processing message', error)
	}

	return createOutput(episodes)
}

export default processItems
