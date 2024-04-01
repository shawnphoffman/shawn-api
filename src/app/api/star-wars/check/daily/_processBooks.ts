import { log } from 'next-axiom'

import { Book, getAllBooks } from '@/getters/star-wars/books'
import { postBleet } from '@/utils/bluesky'
import { sendWebhook } from '@/utils/discord'
import redis, { RedisKey } from '@/utils/redis'

// =================
// BOOKS
// =================

//
// FILTERS
//
const formatBlacklist = ['reprint']

//
// FORMATTERS
//
const getAuthor = (author: Book['author']) => {
	return author && author.length ? `(${author})` : ''
}
const createMessageForDiscord = (book: Book) => {
	return `
**${book.title} ${getAuthor(book.author)}**
- ${book.format}
[More Info Here](https://starwars.fandom.com${book.url})`
}
const createMessageForBsky = (book: Book) => {
	return `  ${book.title} ${getAuthor(book.author)}
#StarWars #Books #NewRelease`
}
const createOutput = (books: Book[]) => {
	return books.map(c => `	- ${c.title} - ${getAuthor(c.author)} - ${c.format} - ${c.pubDate.toDateString()}`).join('\n')
}

//
// PROCESSOR
//
const processItems = async ({ debug }): Promise<string> => {
	// Basics
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	// Get Books
	const books = await getAllBooks()
	const outBooks = books.filter(c => {
		// Filter out blacklisted formats
		if (c.format && formatBlacklist.some(b => c.format && c.format.toLowerCase().includes(b))) {
			return false
		}
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		// log.info({
		// 	type: 'book',
		// 	title: c.title,
		// 	pubDate,
		// })

		const test = today.getTime() === pubDate.getTime()
		return test
	})

	if (!outBooks.length) {
		return '  - No books today'
	}

	try {
		for (const c of outBooks) {
			const redisMember = `books:${c.title}`

			if (debug) {
				continue
			}

			// Discord
			const discordExists = await redis.sismember(RedisKey.Discord, redisMember)
			if (!discordExists) {
				await sendWebhook(
					process.env.DISCORD_WEBHOOK_BOOKS,
					{
						username: `Books Releasing (${today.toDateString()})`,
						content: createMessageForDiscord(c),
						avatar_url: 'https://blueharvest.rocks/bots/bh_red@2x.png',
					},
					true
				)
				await redis.sadd(RedisKey.Discord, redisMember)
			} else {
				log.info('+ Redis.discord.exists', { redisMember })
			}

			// Bluesky
			const blueskyExists = await redis.sismember(RedisKey.Bluesky, redisMember)
			if (!blueskyExists) {
				log.info(`Bleeting book: ${c.title}`)

				await postBleet({
					contentType: 'Book',
					title: c.title,
					items: createMessageForBsky(c),
					url: `https://starwars.fandom.com${c.url}`,
				})

				await redis.sadd(RedisKey.Bluesky, redisMember)
			} else {
				log.info('+ Redis.bluesky.exists', { redisMember })
			}
		}
	} catch (error) {
		log.error('Error bleeting message', error)
	}

	return createOutput(outBooks)
}

export default processItems
