import { log } from 'next-axiom'

import { getAllNews, NewsItem } from '@/getters/star-wars/news'
import { postBleet } from '@/utils/bluesky'
import redis, { RedisKey } from '@/utils/redis'

// =================
// NEWS
// =================

//
// FILTERS
//
const blacklistWords = ['quiz', 'trivia', 'recipe']

//
// FORMATTERS
//
const formatNewsForBsky = (newsItem: NewsItem) => {
	return `${newsItem.title}

${newsItem.desc}

#StarWars #StarWarsNews`
}
const createOutput = (news: NewsItem[]) => {
	return news.map(c => `	- ${c.title}`).join('\n')
}

//
// PROCESSOR
//
async function processItems({ debug }) {
	const news = await getAllNews()

	if (!news.length) {
		return 'No news today'
	}

	try {
		for (const item of news) {
			const redisMember = `sw-news:${item.title}`

			if (debug) {
				continue
			}

			// Filter out items by title
			if (blacklistWords.some(b => item.title.toLowerCase().includes(b))) {
				log.info('🗑️ Blacklisted Word', { title: item.title })
				continue
			}

			// TODO - Discord

			// Bluesky
			const blueskyExists = await redis.sismember(RedisKey.Bluesky, redisMember)
			if (!blueskyExists) {
				log.info(`Bleeting news: ${item.title}`)
				const bleet = {
					title: item.title,
					items: formatNewsForBsky(item),
					url: item.link,
					desc: item.desc,
				}
				await postBleet(bleet)
				await redis.sadd(RedisKey.Bluesky, redisMember)
			} else {
				log.info('+ Redis.bluesky.exists', { redisMember })
			}
		}
	} catch (error) {
		log.error('Error bleeting message', error)
	}

	return createOutput(news)
}

export default processItems