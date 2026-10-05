import { YouTubeFeedConfig } from '@/config/feeds/types'
import { getYouTubeFeed } from '@/getters/rss-feed/recent'
import { postRssBleet } from '@/third-party/bluesky/bluesky-rss'
import { isYouTubeScheduled, isYouTubeShort } from '@/third-party/youtube'
import { RedisKey } from '@/utils/redis'

import { deliver, FeedResult, markFeedDown, newFeedResult } from './_result'

// =================
// YOUTUBE FEEDS
// =================

type ProcessItemsProps = { debug: boolean; config: YouTubeFeedConfig }

async function processItems({ debug, config }: ProcessItemsProps): Promise<FeedResult> {
	const result = newFeedResult(config.name)
	const { feed, items } = await getYouTubeFeed(config.url)

	if (!feed) {
		markFeedDown(result, `No youtube feed found for "${config.url}"`)
		return result
	}

	console.log(`🎧 Processing youtube feed: ${feed?.title}`)

	if (debug) {
		console.log(`🗣️`, feed)
	}
	for (const item of items) {
		let isShort: boolean
		let isScheduled: boolean
		try {
			;[isShort, isScheduled] = await Promise.all([isYouTubeShort(item.guid), isYouTubeScheduled(item.guid)])
		} catch (error) {
			markFeedDown(result, `Could not check whether ${item.guid} is a short or scheduled`, error)
			continue
		}

		if (isShort || isScheduled || (config.isValid && !config.isValid(item))) {
			continue
		}

		result.items.push(item.title)

		if (debug) {
			console.log(`🎙️`, {
				item,
				isShort,
				isScheduled,
			})
			continue
		}

		const redisMember = `${config.event}:${item.guid || item.link}`

		// Discord posting for YouTube is switched off; see git history for the old block

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
	}

	return result
}

export default processItems
