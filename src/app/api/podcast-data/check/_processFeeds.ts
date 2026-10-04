import { PodFeedConfig } from '@/config/feeds/types'
import { getPodcastFeed } from '@/getters/rss-feed/recent'
import { postRssBleet } from '@/third-party/bluesky/bluesky-rss'
import { sendNonPodWebhookRaw, sendRssWebhook } from '@/third-party/discord/discord-rss'
import WebhookChannel from '@/third-party/discord/webhookChannels'
import pingOvercast from '@/third-party/notifiers/overcast'
import { pingRefreshUrls } from '@/third-party/notifiers/urls'
import { RedisKey } from '@/utils/redis'

import { deliver, FeedResult, newFeedResult, recordError } from './_result'

// =================
// PODCASTS
// =================

type ProcessItemsProps = { debug: boolean; config: PodFeedConfig }
async function processItems({ debug, config }: ProcessItemsProps): Promise<FeedResult> {
	const result = newFeedResult(config.name)
	const { meta: podcast, episodes } = await getPodcastFeed(config.url)

	if (!podcast) {
		recordError(result, `No podcast feed found for "${config.url}"`)
		return result
	}

	console.log(`🎧 Processing podcast: ${podcast?.title}`)

	if (debug) {
		console.log(`🗣️`, podcast)
	}
	for (const episode of episodes) {
		result.items.push(episode.title)
		if (debug) {
			console.log(`🎙️`, episode)
			continue
		}

		const redisMember = `${config.event}:${episode.guid || episode.link}`
		const image = episode.imageURL || podcast.imageURL

		// Post to Discord?
		if (config.channel) {
			const channel = config.channel
			await deliver(result, 'Discord', RedisKey.RssDiscord, redisMember, () =>
				sendRssWebhook({ name: config.name, item: episode, avatar: image, webhook: channel, homepage: config.homepage })
			)
		}

		// Post to BlueSky?
		if (config.bluesky) {
			await deliver(result, 'Bluesky', RedisKey.RssBluesky, redisMember, () =>
				postRssBleet({
					name: config.name,
					item: episode,
					homepage: config.homepage,
					handle: config.bskyHandle,
					hashtags: config.hashtags,
					imageOverride: episode.imageURL ? undefined : podcast.imageURL,
				})
			)
		}

		// Ping Overcast?
		if (config.ping !== false) {
			await deliver(result, 'Overcast', RedisKey.RssOvercast, redisMember, () => pingOvercast(config.url))
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
