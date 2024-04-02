import { log } from 'next-axiom'

import { Comic, getAllComics } from '@/getters/star-wars/comics'
import { postBleet } from '@/third-party/bluesky/bluesky'
import { sendWebhook } from '@/third-party/discord/discord'
import { cleanDate, displayDate, getTomorrow, isSameDate } from '@/utils/dates'
import redis, { RedisKey } from '@/utils/redis'

// =================
// COMICS
// =================

//
// FORMATTERS
//
const createMessageForDiscord = (comic: Comic) => {
	return `
**${comic.title}**
[More Info Here](${comic.url})`
}
const createMessageForBsky = (comic: Comic) => {
	return `  ${comic.title}
Release Date: ${displayDate(comic.pubDate)}
#StarWars #Comics #NewRelease`
}
const createOutput = (comics: Comic[]) => {
	return comics.map(c => `  🦹‍♂️ ${c.title} - ${c.type} - ${displayDate(c.pubDate)}`).join('\n')
}

//
// PROCESSOR
//
const processItems = async ({ debug }): Promise<string> => {
	// Basics
	const tomorrow = getTomorrow()

	// Get Comics
	const comics = await getAllComics()
	const outComics = comics.filter(c => {
		const pubDate = cleanDate(c.pubDate)

		// log.info({
		// 	type: 'comic',
		// 	title: c.title,
		// 	pubDate,
		// })

		const test = isSameDate(pubDate, tomorrow)
		return test
	})

	if (!outComics.length) {
		return `  - No comics for "${displayDate(tomorrow)}"`
	}

	try {
		for (const c of outComics) {
			const redisMember = `comics:${c.title}`

			if (debug) {
				continue
			}

			// Discord
			const discordExists = await redis.sismember(RedisKey.Discord, redisMember)
			if (!discordExists) {
				await sendWebhook(
					process.env.DISCORD_WEBHOOK_COMICS,
					{
						username: `Comics Releasing (${displayDate(tomorrow)})`,
						content: createMessageForDiscord(c),
						avatar_url: 'https://blueharvest.rocks/bots/bh_blue@2x.png',
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
				log.info(`Bleeting comic: ${c.title}`)

				await postBleet({
					contentType: 'Comic',
					items: createMessageForBsky(c),
					title: c.title,
					url: c.url,
				})

				await redis.sadd(RedisKey.Bluesky, redisMember)
			} else {
				log.info('+ Redis.bluesky.exists', { redisMember })
			}
		}
	} catch (error) {
		log.error('Error bleeting message', error)
	}

	return createOutput(outComics)
}

export default processItems
