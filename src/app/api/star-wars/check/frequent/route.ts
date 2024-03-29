// import { crossPostMessage } from '@/utils/discord'
import { log } from 'next-axiom'

import { getNews } from '@/pages/api/star-wars/get/official-news'
import { postBleet } from '@/utils/bluesky'
import redis, { RedisKey } from '@/utils/redis'

const blacklistWords = ['quiz', 'trivia', 'recipe']

//
// NEWS
//
const formatNewsForBsky = newsItem => {
	return `${newsItem.title}

${newsItem.desc}

#StarWars #StarWarsNews`
}

async function processNews(news) {
	await new Promise(resolve => setTimeout(resolve, 2000))
	if (news.length) {
		try {
			for (const item of news) {
				const redisMember = `sw-news:${item.title}`

				// Filter out items by title
				if (blacklistWords.some(b => item.title.toLowerCase().includes(b))) {
					log.info('🗑️ Blacklisted Word', { title: item.title })
					continue
				}

				// BLUESKY
				const blueskyExists = await redis.sismember(RedisKey.Bluesky, redisMember)
				if (!blueskyExists) {
					console.log(`Bleeting news: ${item.title}`)
					log.info(`Bleeting news: ${item.title}`)
					const bleet = {
						title: item.title,
						items: formatNewsForBsky(item),
						url: item.link,
						desc: item.desc,
						contentType: null,
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
}

const encoder = new TextEncoder()

async function* makeIterator() {
	yield encoder.encode('<p>Starting..</p>')
	const news = await getNews()
	yield encoder.encode('<p>Processing...</p>')
	await processNews(news)
	yield encoder.encode('<p>Finished</p><hr />')
	yield encoder.encode(`<p>News Items: ${news.length}</p>`)
	yield encoder.encode(`
	<p>News:</li>
	<ul>
		${news.map(n => `<li>${n.title}</li>`).join('')}
	</ul>
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
