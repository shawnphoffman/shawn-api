// import 'dotenv/config'

// import { postBleet } from '../bluesky/bluesky'
// import { sendNonPodWebhookRaw, sendWebhook } from '../discord/discord'
// import pingOvercast from '../notifiers/overcast'
// import pingRefreshUrl from '../notifiers/urls'
// import redis, { RedisKey } from '../redis/redis'
// import RssFeedEmitter from '../rss-feed-emitter'
// import FeedItem from '../rss-feed-emitter/FeedItem'
// import { getItemImage } from '../../utils/imageUtils'
// import { logItem } from '../utils/logging'
// import refresh from '../../utils/refreshIntervals'
import WebhookChannel from '@/third-party/discord/webhookChannels'

import type { PodFeedConfig } from './types'

export const podcastFeeds: PodFeedConfig[] = [
	{
		name: 'Blue Harvest',
		url: 'https://feed.podbean.com/blueharvestpodcast/feed.xml',
		event: 'blue-harvest',
		// refresh: refresh.short,
		channel: WebhookChannel.BlueHarvest,
		bluesky: true,
		bskyHandle: ['blueharvest.bsky.social'],
		homepage: 'https://blueharvest.rocks',
		hashtags: ['#StarWars', '#Podcast', '#BlueHarvest'],
	},
	{
		name: 'Blue Harvest Patreon',
		url: process.env.RSS_BLUE_HARVEST_PATREON!,
		event: 'blue-harvest-patreon',
		// refresh: refresh.medium,
		channel: WebhookChannel.BlueHarvest,
		bluesky: false,
		ping: false,
		refreshUrls: ['https://blueharvest.rocks/patreon-preview'],
		hashtags: ['#StarWars', '#Podcast', '#BlueHarvest'],
	},
	{
		name: 'High Potion',
		url: 'https://anchor.fm/s/5dc2916c/podcast/rss',
		event: 'high-potion',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		bluesky: true,
		bskyHandle: ['blueharvest.bsky.social', 'stonedcobra.bsky.social'],
		homepage: 'https://myweirdfoot.com',
		refreshUrls: ['https://myweirdfoot.com/refresh', 'https://myweirdfoot.com/episodes'],
		hashtags: ['#VideoGames', '#Podcast', '#HighPotion'],
	},
	{
		name: 'Jammed Transmissions',
		url: 'https://anchor.fm/s/d8972e20/podcast/rss',
		event: 'jammed-transmissions',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		bluesky: true,
		bskyHandle: ['jammedtransmissions.com'],
		homepage: 'https://jammedtransmissions.com',
		refreshUrls: ['https://jammedtransmissions.com/refresh', 'https://jammedtransmissions.com/episodes'],
		hashtags: ['#StarWars', '#Podcast', '#JammedTransmissions'],
	},
	{
		name: 'Canto Bight',
		url: 'https://feeds.soundcloud.com/users/soundcloud:users:354222428/sounds.rss',
		event: 'canto-bight',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		bskyHandle: ['cantobightpod.bsky.social'],
		bluesky: true,
		hashtags: ['#StarWars', '#Podcast', '#CantoBight'],
	},
	{
		name: 'The Sith List',
		url: 'https://anchor.fm/s/2bd2304/podcast/rss',
		event: 'sith-list',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		bluesky: true,
		bskyHandle: ['sithlist.bsky.social'],
		homepage: 'https://sithlist.com/',
		hashtags: ['#StarWars', '#Podcast', '#SithList'],
	},
	{
		name: 'Scruffy Looking Podcasters',
		url: 'https://feed.podbean.com/scruffypodcasters/feed.xml',
		event: 'scruffys',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		bluesky: true,
		homepage: 'https://scruffypod.com',
		hashtags: ['#StarWars', '#Podcast', '#ScruffyLookingPodcasters'],
	},
	{
		name: 'Rogue Rebels',
		url: 'https://anchor.fm/s/4fe27918/podcast/rss',
		event: 'rogue-rebels',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		bluesky: true,
		homepage: 'https://theroguerebels.com/',
		bskyHandle: ['theroguerebels.bsky.social'],
		hashtags: ['#StarWars', '#Podcast', '#RogueRebels'],
	},
	{
		name: 'Star Wars Spelt Out',
		url: 'https://feed.podbean.com/starwarsspeltout/feed.xml',
		event: 'spelt-out',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		bskyHandle: ['starwarsspeltout.bsky.social'],
		bluesky: true,
		hashtags: ['#StarWars', '#Podcast', '#StarWarsSpeltOut'],
	},
	{
		name: 'That Geek Pod',
		url: 'https://feed.podbean.com/thatgeekpod/feed.xml',
		event: 'geek-pod',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		bskyHandle: ['catherinekneen.bsky.social'],
		bluesky: true,
		hashtags: ['#StarWars', '#Podcast', '#ThatGeekPod'],
	},
	{
		name: 'Steele Wars',
		url: 'https://feeds.acast.com/public/shows/6d969aa5-8ed7-4683-88f6-d9dce2d9b226',
		event: 'steele-wars',
		// refresh: refresh.short,
		homepage: 'http://steelewars.com/',
		bluesky: true,
		hashtags: ['#StarWars', '#Podcast', '#SteeleWars'],
	},
	{
		name: 'Gunga Beach',
		url: 'https://gungabeachpodcast.podomatic.com/rss2.xml',
		event: 'gunga-beach',
		// refresh: refresh.medium,
		bluesky: true,
		channel: WebhookChannel.Friends,
		bskyHandle: ['stevemac79.bsky.social', 'brettpaci.bsky.social'],
		hashtags: ['#StarWars', '#Podcast', '#GungaBeach'],
	},
	{
		name: `Just Shillin'`,
		url: 'https://feeds.zencastr.com/f/l5bmy6wm.rss',
		event: 'just-shillin-pod',
		// refresh: refresh.short,
		channel: WebhookChannel.Friends,
		homepage: 'https://justshillin.com',
		bluesky: true,
		bskyHandle: ['shawn.party', 'minganna1972.bsky.social'],
		refreshUrls: ['https://justshillin.com/refresh', 'https://justshillin.com/episodes'],
		hashtags: ['#StarWars', '#Podcast', '#JustShillin'],
	},
	{
		name: `Bluey Podcast`,
		url: 'https://anchor.fm/s/bdcbfb70/podcast/rss',
		event: 'bluey-pod',
		// refresh: refresh.medium,
		homepage: 'https://blueypodcast.com',
		bluesky: false,
		refreshUrls: ['https://blueypodcast.com/refresh', 'https://blueypodcast.com/episodes'],
		hashtags: ['#Bluey', '#Podcast', '#DinnerWithTheHeelers'],
	},
]

// const init = (feeder: RssFeedEmitter) => {
// 	console.log('================')
// 	console.log('INIT PODCASTS...')
// 	console.log('================')

// 	podcasts.forEach(feed => {
// 		// Add the feed
// 		console.log(`Adding feed: ${feed.name}`)
// 		feeder.add({
// 			url: feed.url,
// 			refresh: feed.refresh,
// 			eventName: feed.event,
// 		})

// 		// Register the event
// 		console.log(`Adding event: ${feed.event}`)
// 		feeder.on(feed.event, async function (item: FeedItem) {
// 			const name = feed.name
// 			const image = getItemImage(item)

// 			const yesterday = new Date()
// 			yesterday.setDate(yesterday.getDate() - 1)
// 			if (item.date < yesterday) {
// 				// console.log('TOO OLD', `${name}: ${item.title}`)
// 				return
// 			}

// 			logItem(name, item)

// 			const redisMember = `${feed.event}:${item.guid}`

// 			// Post to Discord?
// 			if (feed.channel) {
// 				const exists = await redis.sismember(RedisKey.Discord, redisMember)
// 				if (!exists) {
// 					console.log('⭕ Redis.discord.not.exists', redisMember)
// 					await sendWebhook(name, item, image, feed.channel, feed.homepage)
// 					redis.sadd(RedisKey.Discord, redisMember)
// 				} else {
// 					console.log('🆗 Redis.discord.exists', redisMember)
// 				}
// 			}

// 			// Post to BlueSky?
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

// 			// Ping Overcast?
// 			if (feed.ping !== false) {
// 				const exists = await redis.sismember(RedisKey.Overcast, redisMember)
// 				if (!exists) {
// 					console.log('⭕ Redis.overcast.not.exists', redisMember)
// 					pingOvercast(feed.url)
// 					redis.sadd(RedisKey.Overcast, redisMember)
// 				} else {
// 					console.log('🆗 Redis.overcast.exists', redisMember)
// 				}
// 			}

// 			// Ping Refresh URLs?
// 			if (feed.refreshUrls?.length > 0) {
// 				pingRefreshUrl(name, feed.refreshUrls)
// 				sendNonPodWebhookRaw('RSS Refresh URLs', WebhookChannel.ShawnDev, `Pinging refresh URLs for ${name}`)
// 			}
// 		})

// 		console.log('')
// 	})
// }

// export default init
