import { log } from 'next-axiom'

import { getAllNews, getYoutiniNews, NewsItem } from '@/getters/star-wars/news'
import { postBleetToBsky } from '@/third-party/bluesky/bluesky'
import redis, { RedisKey } from '@/utils/redis'

// =================
// YOUTINI
// =================

const bskyHandle = 'youtini.bsky.social'

//
// FILTERS
//
const blacklistWords = ['quiz', 'trivia', 'recipe']

//
// FORMATTERS
//
const formatNewsForBsky = (newsItem: NewsItem) => {
	let news = `${newsItem.title}`
	// return `${newsItem.title}

	if (newsItem.desc) {
		news += `\n\n${newsItem.desc}`
	}

	news += `
@${bskyHandle}`

	news += `\n\n#StarWars #Youtini`

	return news
}

const createOutput = (news: NewsItem[]) => {
	return `<ul>${news.map(c => `<li>${c.title}</li>`).join('')}</ul>`
}

//
// PROCESSOR
//
async function processItems({ debug }) {
	const news = await getYoutiniNews()

	if (!news.length) {
		return '<i>No youtini news today</i>'
	}

	try {
		for (const item of news) {
			const redisMember = `youtini-news:${item.title}`

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
			const blueskyExists = await redis().sismember(RedisKey.Bluesky, redisMember)
			if (!blueskyExists) {
				log.info(`Bleeting youtininews: ${item.title}`)
				const bleet = {
					title: item.title,
					items: formatNewsForBsky(item),
					url: item.link,
					desc: item.desc,
				}
				await postBleetToBsky(bleet)
				await redis().sadd(RedisKey.Bluesky, redisMember)
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
