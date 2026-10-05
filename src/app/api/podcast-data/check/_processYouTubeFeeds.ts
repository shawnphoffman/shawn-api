import { log } from 'next-axiom'

import { YouTubeFeedConfig } from '@/config/feeds/types'
import { getYouTubeFeed, YouTubeFeedType, YouTubeItemType } from '@/getters/rss-feed/recent'
import { getYouTubeUploads } from '@/getters/youtube/uploads'
import { postRssBleet } from '@/third-party/bluesky/bluesky-rss'
import { isYouTubeScheduled, isYouTubeShort } from '@/third-party/youtube'
import { RedisKey } from '@/utils/redis'

import { deliver, FeedResult, markFeedDown, newFeedResult } from './_result'

// =================
// YOUTUBE FEEDS
// =================

/**
 * Reads the channel's recent uploads from the YouTube Data API, and falls back
 * to its RSS feed when the API fails (a used-up quota, say). Both give the
 * video id as the guid, so the Redis records match whichever one answered.
 */
async function getRecentVideos(config: YouTubeFeedConfig): Promise<{ feed?: YouTubeFeedType; items: YouTubeItemType[]; apiError?: string }> {
	try {
		return await getYouTubeUploads(config.channelId)
	} catch (error) {
		const apiError = error instanceof Error ? error.message : String(error)
		log.warn('YouTube API failed, trying RSS', { feed: config.name, error: apiError })
		return { ...(await getYouTubeFeed(config.url)), apiError }
	}
}

type ProcessItemsProps = { debug: boolean; config: YouTubeFeedConfig }

async function processItems({ debug, config }: ProcessItemsProps): Promise<FeedResult> {
	const result = newFeedResult(config.name)
	const { feed, items, apiError } = await getRecentVideos(config)

	if (!feed) {
		markFeedDown(result, `No YouTube videos for ${config.channelId}: API failed (${apiError}) and the RSS feed would not load`)
		return result
	}

	console.log(`🎧 Processing youtube feed: ${feed?.title}${apiError ? ' (from RSS)' : ''}`)

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
