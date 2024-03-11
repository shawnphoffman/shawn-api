import { getAllComics } from './future-comics'
import { getBooks } from './future-books'
import { getTV } from './future-tv'
import { crossPostMessage } from '@/utils/discord'
import { postBleet } from '@/components/bluesky/bluesky'
import redis, { RedisKey } from '@/utils/redis'

const dateString = d => {
	return new Date(d).toDateString()
}

//
// COMICS
//
const processComic = comic => {
	return `
**${comic.title}**
[More Info](https://starwars.fandom.com${comic.url})`
}
const processComicForBsky = comic => {
	return `  ${comic.title}
#StarWars #Comics #NewRelease`
}

//
// BOOKS
//
const getAuthor = author => (author && author.length ? `(${author})` : '')
const processBook = book => {
	return `
**${book.title} (${book.author})**
- ${book.format}
[More Info](https://starwars.fandom.com${book.url})`
}
const processBookForBsky = book => {
	return `  ${book.title} ${getAuthor(book.author)}
#StarWars #Books #NewRelease`
}

//
// TV
//
const processTv = tv => {
	const cleanDate = new Date(tv.pubDate)
	cleanDate.setDate(cleanDate.getDate() + 1)
	return `
**${tv.series} (${tv.episode})**
- *Title:* ${tv.title}
- *Release Date*: <t:${cleanDate.getTime() / 1000}:d>
- [*More Info:*](${tv.url})`
}
const processTvForBsky = tv => {
	return `  ${tv.series} (${tv.episode})
  Title: ${tv.title}
#StarWars #TV #NewRelease`
}

// function spliceIntoChunks(arr, chunkSize = 4) {
// 	const res = []
// 	while (arr.length > 0) {
// 		const chunk = arr.splice(0, chunkSize)
// 		res.push(chunk)
// 	}
// 	return res
// }

async function sendWebhook(url, content) {
	var myHeaders = new Headers()
	myHeaders.append('Content-Type', 'application/json')

	var requestOptions = {
		headers: myHeaders,
		method: 'POST',
		body: JSON.stringify(content),
	}

	const response = await fetch(url, requestOptions)

	console.log('-----------------')
	console.log('WEBHOOK RESPONSE')
	console.log(`Status: ${response.status}`)
	console.log(`Status Text: ${response.statusText}`)
	try {
		const json = await response.json()
		return json
	} catch (e) {
		console.error('Error parsing response', e)
	}
}

async function handler(req, res) {
	const debug = req.query?.debug === 'true'

	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	tomorrow.setHours(0, 0, 0, 0)
	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)
	yesterday.setHours(0, 0, 0, 0)

	console.log(`Today is ${today.toString()}`)
	console.log(`Tomorrow is ${tomorrow.toString()}`)

	// Comics
	const comics = await getAllComics()
	const outComics = comics.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		// console.log({
		// 	type: 'comic',
		// 	title: c.title,
		// 	pubDate,
		// 	tomorrow,
		// 	today,
		// 	pubTime: pubDate.getTime(),
		// 	tomTime: tomorrow.getTime(),
		// 	todTime: today.getTime(),
		// 	tomTest: tomorrow.getTime() === pubDate.getTime(),
		// 	todTest: today.getTime() === pubDate.getTime(),
		// })
		const test = today.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	if (outComics.length && !debug) {
		try {
			outComics.forEach(async c => {
				const redisMember = `comics:${c.title}`

				const discordExists = await redis.sismember(RedisKey.Discord, redisMember)
				if (!discordExists) {
					const resp = await sendWebhook(process.env.DISCORD_WEBHOOK_COMICS, {
						username: `Comics Releasing (${dateString(today)})`,
						content: outComics.map(processComic).join('\n'),
						avatar_url: 'https://blueharvest.rocks/bots/bh_blue@2x.png',
					})
					if (resp && resp.id && resp.channel_id && resp.author?.bot) {
						await crossPostMessage(resp.channel_id, resp.id)
					}
					redis.sadd(RedisKey.Discord, redisMember)
				} else {
					console.log('+ Redis.discord.exists', redisMember)
				}

				const exists = await redis.sismember(RedisKey.Bluesky, redisMember)
				if (!exists) {
					console.log(`Bleeting comic: ${c.title}`)

					await postBleet({
						contentType: 'Comic',
						title: c.title,
						items: processComicForBsky(c),
						url: `https://starwars.fandom.com${c.url}`,
					})

					redis.sadd(RedisKey.Bluesky, redisMember)
				} else {
					console.log('+ Redis.bluesky.exists', redisMember)
				}
			})
		} catch (error) {
			console.error('Error bleeting message', error)
		}
	}

	// Books
	const books = await getBooks()
	const outBooks = books.filter(c => {
		if (c.format && c.format.toLowerCase().includes('reprint')) {
			return false
		}
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		console.log({
			type: 'book',
			title: c.title,
			pubDate,
			tomorrow,
			today,
			yesterday,
			pubTime: pubDate.getTime(),
			tomTime: tomorrow.getTime(),
			todTime: today.getTime(),
			yesTime: yesterday.getTime(),
			tomTest: tomorrow.getTime() === pubDate.getTime(),
			todTest: today.getTime() === pubDate.getTime(),
		})

		const test = today.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	console.log(outBooks)

	if (outBooks.length && !debug) {
		try {
			outBooks.forEach(async c => {
				const redisMember = `books:${c.title}`

				const discordExists = await redis.sismember(RedisKey.Discord, redisMember)
				if (!discordExists) {
					await sendWebhook(process.env.DISCORD_WEBHOOK_BOOKS, {
						username: `Books Releasing (${dateString(today)})`,
						content: processBook(c),
						avatar_url: 'https://blueharvest.rocks/bots/bh_red@2x.png',
					})
					redis.sadd(RedisKey.Discord, redisMember)
				} else {
					console.log('+ Redis.discord.exists', redisMember)
				}

				const exists = await redis.sismember(RedisKey.Bluesky, redisMember)
				if (!exists) {
					console.log(`Bleeting book: ${c.title}`)
					await postBleet({ contentType: 'Book', title: c.title, items: processBookForBsky(c), url: `https://starwars.fandom.com${c.url}` })

					redis.sadd(RedisKey.Bluesky, redisMember)
				} else {
					console.log('+ Redis.bluesky.exists', redisMember)
				}
			})
		} catch (error) {
			console.error('Error bleeting message', error)
		}
	}

	// TV
	const tv = await getTV()
	const outTv = tv.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		// console.log({
		// 	type: 'tv',
		// 	title: c.title,
		// 	pubDate,
		// 	tomorrow,
		// 	today,
		// 	pubTime: pubDate.getTime(),
		// 	tomTime: tomorrow.getTime(),
		// 	todTime: today.getTime(),
		// 	tomTest: tomorrow.getTime() === pubDate.getTime(),
		// 	todTest: today.getTime() === pubDate.getTime(),
		// })
		const test = today.getTime() === pubDate.getTime()
		return test
		// return today === pubDate
	})

	if (outTv.length && !debug) {
		try {
			outTv.forEach(async c => {
				const redisMember = `tv:${c.title}`

				const discordExists = await redis.sismember(RedisKey.Discord, redisMember)
				if (!discordExists) {
					await sendWebhook(process.env.DISCORD_WEBHOOK_TV, {
						username: `TV Shows Premiering (${dateString(today)})`,
						content: processTv(c),
						avatar_url: 'https://blueharvest.rocks/bots/bh_teal@2x.png',
					})
					redis.sadd(RedisKey.Discord, redisMember)
				} else {
					console.log('+ Redis.discord.exists', redisMember)
				}

				const exists = await redis.sismember(RedisKey.Bluesky, redisMember)
				if (!exists) {
					console.log(`Bleeting TV show: ${c.title}`)
					await postBleet({ contentType: 'TV Show', title: c.title, items: processTvForBsky(c), url: c.url })

					redis.sadd(RedisKey.Bluesky, redisMember)
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
		bookCount: outBooks.length,
		comicCount: outComics.length,
		tvCount: outTv.length,
		bookTest: yesterday,
		comicTest: tomorrow,
		tvTest: today,
		books,
	})
}

export default handler

export const config = {
	api: {
		bodyParser: false,
	},
}
