import { getAllNews, NewsItem } from '@/getters/star-wars/news'
import { postBleetToBsky } from '@/third-party/bluesky/bluesky'
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
	let news = `${newsItem.title}`
	// return `${newsItem.title}

	if (newsItem.desc) {
		news += `\n\n${newsItem.desc}`
	}

	news += `\n\n#StarWars #StarWarsNews`

	return news
}

const createOutput = (news: NewsItem[]) => {
	return `<ul>${news.map(c => `<li>${c.title}</li>`).join('')}</ul>`
}

//
// PROCESSOR
//
async function processItems({ debug }) {
	const news = await getAllNews()

	console.log(`📰 Processing official Star Wars News`)

	if (!news.length) {
		return '<i>No news today</i>'
	}

	try {
		for (const item of news) {
			const redisMember = `sw-news:${item.title}`

			if (debug) {
				console.log(`🗞️`, item)
				continue
			}

			// Filter out items by title
			if (blacklistWords.some(b => item.title.toLowerCase().includes(b))) {
				console.log('    🗑️ Blacklisted Word', { title: item.title })
				continue
			}

			// TODO - Discord

			// Bluesky
			const blueskyExists = await redis().sismember(RedisKey.Bluesky, redisMember)
			if (!blueskyExists) {
				console.log('    ⚪️ Redis.bluesky.not.exists', redisMember)
				const bleet = {
					title: item.title,
					items: formatNewsForBsky(item),
					url: item.link,
					desc: item.desc,
				}
				await postBleetToBsky(bleet)
				await redis().sadd(RedisKey.Bluesky, redisMember)
			} else {
				console.log('    🔘 Redis.bluesky.exists', redisMember)
			}
		}
	} catch (error) {
		console.error('    🔴 Error bleeting message', error)
	}

	return createOutput(news)
}

export default processItems
