import { log } from 'next-axiom'

import { getNews } from '@/pages/api/star-wars/get/official-news'
import { postBleet } from '@/utils/bluesky'
import redis, { RedisKey } from '@/utils/redis'

// =================
// NEWS
// =================

//
// TYPES
//
export type NewsItem = {
	title: string
	desc: string
	link?: string
	imgSrc: string
}

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

//
// PROCESSOR
//
async function processNews(news: NewsItem[]) {
	if (!news.length) {
		return 'No news today'
	}

	try {
		for (const item of news) {
			const redisMember = `sw-news:${item.title}`

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
}

const encoder = new TextEncoder()

async function* makeIterator() {
	yield encoder.encode(`========================================\n
Starting...\n
`)
	const news = await getNews()
	yield encoder.encode(`Processing...\n
`)
	await processNews(news)
	yield encoder.encode(`Finished!\n
========================================\n
Items: ${news.length}
News:
${news.map(n => `  - ${n.title}`).join('\n')}\n
========================================
`)
}

export async function GET(_req, _res) {
	const iterator = makeIterator()
	const stream = new ReadableStream({
		async pull(controller) {
			const { value, done } = await iterator.next()
			if (done) {
				controller.close()
			} else {
				controller.enqueue(value)
			}
		},
	})

	return new Response(stream)
}

export const dynamic = 'force-dynamic'