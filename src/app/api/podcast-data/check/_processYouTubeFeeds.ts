import { log } from 'next-axiom'

import { YouTubeFeedConfig } from '@/config/feeds/types'
import { getYouTubeFeed, YouTubeItemType } from '@/getters/rss-feed/recent'
import { postRssBleet } from '@/third-party/bluesky/bluesky-rss'
import { isYouTubeScheduled,isYouTubeShort } from '@/third-party/youtube'
import redis, { RedisKey } from '@/utils/redis'

// =================
// YOUTUBE FEEDS
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
type ProcessItemsProps = { debug: boolean; config: YouTubeFeedConfig }

async function processItems({ debug, config }: ProcessItemsProps) {
	const { feed, items } = await getYouTubeFeed(config.url)

	if (!feed) {
		return `<i>❌ No youtube feed found for "${config.url}"</i>`
	}

	console.log(`🎧 Processing youtube feed: ${feed?.title}`)

	if (!items.length) {
		return `<i>No recent items for "${feed.title}"</i>`
	}

	const outputItems: YouTubeItemType[] = []

	try {
		if (debug) {
			console.log(`🗣️`, feed)
		}
		for (const item of items) {
			// const ytVideoPromise = getYouTubeVideo(item.guid)
			const isShortPromise = isYouTubeShort(item.guid)
			const isScheduledPromise = isYouTubeScheduled(item.guid)

			const [isShort, isScheduled] = await Promise.all([isShortPromise, isScheduledPromise])

			if (isShort || isScheduled) {
				continue
			} else {
				outputItems.push(item)
			}

			if (debug) {
				console.log(`🎙️`, {
					item,
					isShort,
					isScheduled,
				})
			}

			const redisMember = `${config.event}:${item.guid || item.link}`

			// const image = item.imageURL //|| feed.imageURL

			if (debug) {
				continue
			}

			// Post to Discord?
			// if (config.channel) {
			// 	const exists = await redis().sismember(RedisKey.RssDiscord, redisMember)
			// 	if (!exists) {
			// 		console.log('    ⚪️ Redis.discord.not.exists', redisMember)

			// 		await sendRssWebhook({ name: config.name, item: item, avatar: image, webhook: config.channel, homepage: config.homepage })

			// 		redis().sadd(RedisKey.RssDiscord, redisMember)
			// 	} else {
			// 		console.log('    🔘 Redis.discord.exists', redisMember)
			// 	}
			// }

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
		}
	} catch (error) {
		log.error('Error processing message', error)
	}

	return createOutput(outputItems)
}

export default processItems
