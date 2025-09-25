import { log } from 'next-axiom'

import { Book, getAllBooks } from '@/getters/star-wars/books'
import { postBleetToBsky } from '@/third-party/bluesky/bluesky'
import { sendDiscordWebhook } from '@/third-party/discord/discord'
import { cleanDate, displayDate, getTomorrow, isSameDate } from '@/utils/dates'
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
[More Info Here](${book.url})`
}
const createMessageForBsky = (book: Book) => {
	return `  ${book.title} ${getAuthor(book.author)}
Release Date: ${displayDate(book.pubDate)}
#StarWars #Books #NewRelease`
}
const createOutput = (books: Book[]) => {
	return `<ul>${books.map(c => `<li>📙 ${c.title} - ${getAuthor(c.author)} - ${c.format} - ${displayDate(c.pubDate)}</li>`).join('')}</ul>`
}

//
// PROCESSOR
//
const processItems = async ({ debug }): Promise<string> => {
	// Basics
	const tomorrow = getTomorrow()

	// Get Books
	const books = await getAllBooks()
	const outBooks = books.filter(c => {
		// Filter out blacklisted formats
		if (c.format && formatBlacklist.some(b => c.format && c.format.toLowerCase().includes(b))) {
			return false
		}
		const pubDate = cleanDate(c.pubDate)

		// console.log('📗', {
		// 	type: 'book',
		// 	title: c.title,
		// 	pubDate,
		// 	tomorrow,
		// 	test: isSameDate(tomorrow, pubDate),
		// })

		const test = isSameDate(tomorrow, pubDate)
		return test
	})

	if (!outBooks.length) {
		return `<i>No books for "${displayDate(tomorrow)}"</i>`
	}

	try {
		for (const c of outBooks) {
			const redisMember = `books:${c.title}`

			if (debug) {
				continue
			}

			// Discord
			const discordExists = await redis().sismember(RedisKey.Discord, redisMember)
			if (!discordExists) {
				await sendDiscordWebhook(
					process.env.DISCORD_WEBHOOK_BOOKS,
					{
						username: `Books Releasing (${displayDate(tomorrow)})`,
						content: createMessageForDiscord(c),
						avatar_url: 'https://blueharvest.rocks/bots/bh_red@2x.png',
					},
					true
				)
				await redis().sadd(RedisKey.Discord, redisMember)
			} else {
				log.info('+ Redis.discord.exists', { redisMember })
			}

			// Bluesky
			const blueskyExists = await redis().sismember(RedisKey.Bluesky, redisMember)
			if (!blueskyExists) {
				log.info(`Bleeting book: ${c.title}`)

				await postBleetToBsky({
					contentType: 'Book',
					title: c.title,
					items: createMessageForBsky(c),
					url: c.url,
				})

				await redis().sadd(RedisKey.Bluesky, redisMember)
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
