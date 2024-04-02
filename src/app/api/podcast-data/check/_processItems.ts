import { log } from 'next-axiom'

import { getPodcastInfo, getRecentFeedItems } from '@/getters/rss-feed/recent'
// import { getAllNews, NewsItem } from '@/getters/star-wars/news'
// import { postBleet } from '@/utils/bluesky'
// import redis, { RedisKey } from '@/utils/redis'

// =================
// NEWS
// =================

// //
// // FILTERS
// //
// const blacklistWords = ['quiz', 'trivia', 'recipe']

// //
// // FORMATTERS
// //
// const formatNewsForBsky = (newsItem: NewsItem) => {
// 	return `${newsItem.title}

// ${newsItem.desc}

// #StarWars #StarWarsNews`
// }
const createOutput = (episodes: any[]) => {
	return episodes.map(c => `  - ${c.title}`).join('\n')
}

//
// PROCESSOR
//
async function processItems({ debug, feedUrl }) {
	const podcast = await getPodcastInfo(feedUrl)
	const episodes = await getRecentFeedItems(feedUrl)

	if (!episodes.length) {
		return `No recent episodes for ${feedUrl}`
	}

	try {
		for (const episode of episodes) {
			const redisMember = `rss-feed:${episode.title}`

			if (debug) {
				continue
			}

			// // Filter out items by title
			// if (blacklistWords.some(b => item.title.toLowerCase().includes(b))) {
			// 	log.info('🗑️ Blacklisted Word', { title: item.title })
			// 	continue
			// }

			// TODO - Discord

			// // Bluesky
			// const blueskyExists = await redis.sismember(RedisKey.Bluesky, redisMember)
			// if (!blueskyExists) {
			// 	log.info(`Bleeting news: ${item.title}`)
			// 	const bleet = {
			// 		title: item.title,
			// 		items: formatNewsForBsky(item),
			// 		url: item.link,
			// 		desc: item.desc,
			// 	}
			// 	await postBleet(bleet)
			// 	await redis.sadd(RedisKey.Bluesky, redisMember)
			// } else {
			// 	log.info('+ Redis.bluesky.exists', { redisMember })
			// }
		}
	} catch (error) {
		log.error('Error bleeting message', error)
	}

	return createOutput(episodes)
}

export default processItems
