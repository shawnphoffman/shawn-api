import { log } from 'next-axiom'

import { getAllComics } from '@/pages/api/star-wars/get/future-comics'
import { postBleet } from '@/utils/bluesky'
import { sendWebhook } from '@/utils/discord'
import redis, { RedisKey } from '@/utils/redis'

// =================
// COMICS
// =================

//
// TYPES
//
export type Comic = {
	title: string
	type: string
	pubDate: Date
	url: string
}

//
// FORMATTERS
//
const createMessageForDiscord = (comic: Comic) => {
	return `
**${comic.title}**
[More Info Here](https://starwars.fandom.com${comic.url})`
}
const createMessageForBsky = (comic: Comic) => {
	return `  ${comic.title}
#StarWars #Comics #NewRelease`
}
const createOutput = (comics: Comic[]) => {
	return comics.map(c => `	- ${c.title} - ${c.type} - ${c.pubDate.toDateString()}`).join('\n')
}

//
// PROCESSOR
//
const processItems = async ({ debug }): Promise<string> => {
	// Basics
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	// Get Comics
	const comics = await getAllComics()
	const outComics = comics.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		// log.info({
		// 	type: 'comic',
		// 	title: c.title,
		// 	pubDate,
		// })
		const test = today.getTime() === pubDate.getTime()
		return test
	})

	if (!outComics.length) {
		return '  - No comics today'
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
						username: `Comics Releasing (${today.toDateString()})`,
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

	return createOutput(outComics)
}

export default processItems
