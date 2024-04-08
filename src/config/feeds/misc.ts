// // import { postBleet } from '../bluesky/bluesky'
// import redis, { RedisKey } from '../redis/redis'
// import type { MiscFeedConfig } from '../types'
// // import { getOgImageUrl } from '../utils/imageUtils'
// // import refresh from '../utils/refreshIntervals'

// const misc: MiscFeedConfig[] = [
// 	{
// 		name: 'Comic Check',
// 		url: 'https://comicdbase.com/feed/',
// 		event: 'comic-check',
// 		refresh: 1000 * 60 * 60 * 12, // 12 hours
// 		bluesky: false,
// 		callback: async item => {
// 			const yesterday = new Date()
// 			yesterday.setDate(yesterday.getDate() - 1)
// 			if (item.date < yesterday) {
// 				// console.log('TOO OLD', `Comic Check: ${item.title}`)
// 				return
// 			}

// 			console.log('New Weekly Comic Release Link', item.link)

// 			const redisMember = `comic-check:${item.guid}`
// 			const exists = await redis.sismember(RedisKey.ShawnApi, redisMember)
// 			if (!exists) {
// 				console.log('⭕ Redis.shawnapi.not.exists', redisMember)
// 				const url = `https://api.shawn.party/api/star-wars/recent-digital-comics`
// 				const options = {
// 					method: 'POST',
// 					body: JSON.stringify({
// 						scrape: item.link,
// 					}),
// 				}
// 				await fetch(url, options)
// 				redis.sadd(RedisKey.ShawnApi, redisMember)
// 			} else {
// 				console.log('🆗 Redis.shawnapi.exists', redisMember)
// 			}
// 		},
// 	},
// 	// {
// 	// 	name: 'Star Wars Official',
// 	// 	url: 'https://openrss.org/www.starwars.com/news',
// 	// 	event: 'star-wars-official',
// 	// 	refresh: refresh.medium,
// 	// 	bluesky: true,
// 	// 	callback: async item => {
// 	// 		const name = 'Official Star Wars'
// 	// 		const title = item.title

// 	// 		const yesterday = new Date()
// 	// 		yesterday.setDate(yesterday.getDate() - 1)
// 	// 		// yesterday.setDate(yesterday.getDate() - 4)
// 	// 		// yesterday.setHours(0, 0, 0, 0)
// 	// 		if (item.date < yesterday) {
// 	// 			console.log('❄️ Too Old', title)
// 	// 			return
// 	// 		}

// 	// 		// Filter out items by title
// 	// 		const blacklistWords = ['quiz', 'trivia', 'recipe']
// 	// 		if (blacklistWords.some(b => title.toLowerCase().includes(b))) {
// 	// 			console.log('🗑️ Blacklisted Word', title)
// 	// 			return
// 	// 		}

// 	// 		const imageUrl = await getOgImageUrl(item.link)

// 	// 		// console.log('🆕 New Star Wars Official', imageUrl)
// 	// 		const redisMember = `star-wars-official:${item.guid}`

// 	// 		// Post to BlueSky
// 	// 		const exists = await redis.sismember(RedisKey.Bluesky, redisMember)
// 	// 		if (!exists) {
// 	// 			console.log('⭕ Redis.Bluesky.not.exists', redisMember)
// 	// 			postBleet({ name, item, homepage: item.link, hashtags: ['#StarWars'], imageOverride: imageUrl })
// 	// 			redis.sadd(RedisKey.Bluesky, redisMember)
// 	// 		} else {
// 	// 			console.log('🆗 Redis.Bluesky.exists', redisMember)
// 	// 		}
// 	// 	},
// 	// },
// ]

// const init = feeder => {
// 	console.log('================')
// 	console.log('INIT MISC...')
// 	console.log('================')

// 	misc.forEach(feed => {
// 		// Add the feed
// 		console.log(`Adding misc feed: ${feed.name}`)
// 		feeder.add({
// 			url: feed.url,
// 			refresh: feed.refresh,
// 			eventName: feed.event,
// 		})

// 		// Register the event
// 		console.log(`Adding misc event: ${feed.event}`)
// 		feeder.on(feed.event, function (item) {
// 			// const name = feed.name
// 			// logItem(name, item)
// 			feed.callback(item)
// 		})

// 		console.log('')
// 	})
// }

// export default init
