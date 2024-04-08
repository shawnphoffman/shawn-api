// import { isYouTubeScheduled, isYouTubeShort } from '../../third-party/youtube'
// import { getItemImage } from '../../utils/imageUtils'
// import refresh from '../../utils/refreshIntervals'
// import { postBleet } from '../bluesky/bluesky'
// import { sendWebhookRaw } from '../discord/discord'
// import WebhookChannel from '../discord/webhookChannels'
// import redis, { RedisKey } from '../redis/redis'
// import FeedItem from '../rss-feed-emitter/FeedItem'
// import type { FeedConfig, YouTubeSourceType } from '../types'
// // import { logItem } from '../utils/logging'

// const formatYouTubeBody = (name, item) => {
// 	const cleanDate = new Date(item.pubDate).getTime() / 1000
// 	return `**New ${name} Content!!!**
// *Title*: [*${item.title}*](${item.link})
// *Date*: <t:${cleanDate}:d>`
// }

// export const YouTubeSource: YouTubeSourceType = {
// 	BlueHarvest: {
// 		channelId: 'UCnVaIQi3WprpT-2AHsOJbKg',
// 	},
// 	SteeleWars: {
// 		channelId: 'UCxnEDVUZe8-j61nKo4HzOYg',
// 	},
// 	StarWarsExplained: {
// 		channelId: 'UCIKlsX1qfGqKPt4KAW-JOZg',
// 	},
// 	SithList: {
// 		channelId: 'UC-WaYsQiHNrRGLXGHnL1Fuw',
// 	},
// 	StarWarsSpeltOut: {
// 		channelId: 'UCsgw0WcCmz2UT1tSpZnGmpA',
// 	},
// }

// Object.values(YouTubeSource).forEach(s =>
// 	Object.defineProperty(s, 'rssFeed', {
// 		get: () => `https://www.youtube.com/feeds/videos.xml?channel_id=${s.channelId}`,
// 	})
// )

// const youtube: FeedConfig[] = [
// 	{
// 		name: 'Blue Harvest YouTube',
// 		url: YouTubeSource.BlueHarvest.rssFeed,
// 		event: 'blue-harvest-youtube',
// 		refresh: refresh.long,
// 		channel: WebhookChannel.YouTube,
// 		bluesky: true,
// 		bskyHandle: ['blueharvest.bsky.social'],
// 		homepage: 'https://blueharvest.rocks',
// 		hashtags: ['#StarWars', '#BlueHarvest'],
// 	},
// 	{
// 		name: 'Steele Wars YouTube',
// 		url: YouTubeSource.SteeleWars.rssFeed,
// 		event: 'steele-wars-youtube',
// 		refresh: refresh.medium,
// 		bluesky: true,
// 		homepage: 'http://steelewars.com',
// 		hashtags: ['#StarWars', '#SteeleWars'],
// 	},
// 	{
// 		name: 'Star Wars Explained YouTube',
// 		url: YouTubeSource.StarWarsExplained.rssFeed,
// 		event: 'sw-explained-youtube',
// 		refresh: refresh.medium,
// 		bluesky: true,
// 		bskyHandle: ['starwarsexplained.bsky.social'],
// 		hashtags: ['#StarWars', '#StarWarsExplained'],
// 	},
// 	{
// 		name: 'Sith List YouTube',
// 		url: YouTubeSource.SithList.rssFeed,
// 		event: 'sith-list-youtube',
// 		refresh: refresh.long,
// 		bluesky: true,
// 		bskyHandle: ['sithlist.bsky.social'],
// 		homepage: 'https://sithlist.com/',
// 		hashtags: ['#StarWars', '#SithList'],
// 	},
// 	{
// 		name: 'Star Wars Spelt Out YouTube',
// 		url: YouTubeSource.StarWarsSpeltOut.rssFeed,
// 		event: 'spelt-out-youtube',
// 		refresh: refresh.long,
// 		bluesky: true,
// 		bskyHandle: ['starwarsspeltout.bsky.social'],
// 		hashtags: ['#StarWars', '#StarWarsSpeltOut'],
// 	},
// ]

// const init = feeder => {
// 	console.log('================')
// 	console.log('INIT YOUTUBE...')
// 	console.log('================')
// 	youtube.forEach(feed => {
// 		// Add the feed
// 		console.log(`Adding youtube feed: ${feed.name}`)
// 		feeder.add({
// 			url: feed.url,
// 			refresh: feed.refresh,
// 			eventName: feed.event,
// 		})

// 		// Register the event
// 		console.log(`Adding youtube event: ${feed.event}`)
// 		feeder.on(feed.event, async function (item: FeedItem) {
// 			const name = feed.name
// 			const image = getItemImage(item)

// 			const yesterday = new Date()
// 			yesterday.setDate(yesterday.getDate() - 1)
// 			if (item.pubDate < yesterday) {
// 				// console.log('TOO OLD', `${name}: ${item.title}`)
// 				return
// 			}
// 			try {
// 				const videoId = item['yt:videoid']['#']
// 				const isShort = await isYouTubeShort(videoId)
// 				if (isShort) {
// 					console.log('🙈 Ignoring YouTube Short', {
// 						videoId,
// 						title: item.title,
// 						guid: item.guid,
// 					})
// 					return
// 				}

// 				const isScheduled = await isYouTubeScheduled(videoId)
// 				if (isScheduled) {
// 					console.log('🙈 Ignoring YouTube Scheduled', {
// 						videoId,
// 						title: item.title,
// 						guid: item.guid,
// 					})
// 					return
// 				}
// 			} catch {
// 				/* empty */
// 			}

// 			logItem(name, item)

// 			const redisMember = `${feed.event}:${item.guid}`

// 			if (feed.channel) {
// 				const exists = await redis.sismember(RedisKey.Discord, redisMember)
// 				if (!exists) {
// 					console.log('⭕ Redis.discord.not.exists', redisMember)
// 					const payload = formatYouTubeBody(feed.name, item)
// 					await sendWebhookRaw(name, item, image, feed.channel, payload)
// 					redis.sadd(RedisKey.Discord, redisMember)
// 				} else {
// 					console.log('🆗 Redis.discord.exists', redisMember)
// 				}
// 			}

// 			if (feed.bluesky) {
// 				const exists = await redis.sismember(RedisKey.Bluesky, redisMember)
// 				if (!exists) {
// 					console.log('⭕ Redis.bluesky.not.exists', redisMember)
// 					postBleet({ name, item, homepage: feed.homepage, handle: feed.bskyHandle, hashtags: feed.hashtags })
// 					redis.sadd(RedisKey.Bluesky, redisMember)
// 				} else {
// 					console.log('🆗 Redis.bluesky.exists', redisMember)
// 				}
// 			}
// 		})

// 		console.log('')
// 	})
// }

// export default init
