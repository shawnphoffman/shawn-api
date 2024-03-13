// import { crossPostMessage } from '@/utils/discord'
import { postBleet } from '@/components/bluesky/bluesky'
import redis, { RedisKey } from '@/utils/redis'
import { getNews } from './get/official-news'

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
			news.forEach(async item => {
				const redisMember = `sw-news:${item.title}`

				// Filter out items by title
				if (blacklistWords.some(b => item.title.toLowerCase().includes(b))) {
					console.log('🗑️ Blacklisted Word', item.title)
					return
				}

				// BLUESKY
				const blueskyExists = await redis.sismember(RedisKey.Bluesky, redisMember)
				if (!blueskyExists) {
					console.log(`Bleeting news: ${item.title}`)
					const bleet = {
						title: item.title,
						items: processNewsForBsky(item),
						url: item.link,
						desc: item.desc,
					}
					await postBleet(bleet)
					await redis.sadd(RedisKey.Bluesky, redisMember)
				} else {
					console.log('+ Redis.bluesky.exists', redisMember)
				}
			})
		} catch (error) {
			console.error('Error bleeting message', error)
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
	api: {
		bodyParser: false,
	},
}
