// import { crossPostMessage } from '@/utils/discord'
import { postBleet } from '@/components/bluesky/bluesky'
import redis, { RedisKey } from '@/utils/redis'
import { getNews } from './get/official-news'
import { log } from 'next-axiom'

const blacklistWords = ['quiz', 'trivia', 'recipe']

//
// NEWS
//
const processNewsForBsky = newsItem => {
	return `${newsItem.title}

${newsItem.desc}

#StarWars #StarWarsNews`
}

async function handler(req, res) {
	// NEWS
	const news = await getNews()

	if (news.length) {
		try {
			// eslint-disable-next-line no-unused-vars
			// news.forEach(async (item, i) => {
			for (const item of news) {
				const redisMember = `sw-news:${item.title}`

				// Filter out items by title
				if (blacklistWords.some(b => item.title.toLowerCase().includes(b))) {
					log.info('🗑️ Blacklisted Word', item.title)
					continue
				}

				// BLUESKY
				const blueskyExists = await redis.sismember(RedisKey.Bluesky, redisMember)
				// if (!blueskyExists || i === 0) {
				if (!blueskyExists) {
					console.log(`Bleeting news: ${item.title}`)
					log.info(`Bleeting news: ${item.title}`)
					const bleet = {
						title: item.title,
						items: processNewsForBsky(item),
						url: item.link,
						desc: item.desc,
					}
					await postBleet(bleet)
					await redis.sadd(RedisKey.Bluesky, redisMember)
				} else {
					log.info('+ Redis.bluesky.exists', redisMember)
				}
			}
		} catch (error) {
			log.error('Error bleeting message', error)
		}
	}

	res.status(200).json({
		success: true,
		newsItems: news.length,
		news,
	})
}

export default handler

export const config = {
	// maxDuration: 30,
	api: {
		bodyParser: false,
	},
}
