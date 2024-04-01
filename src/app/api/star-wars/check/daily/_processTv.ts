import { log } from 'next-axiom'

import { getTV } from '@/pages/api/star-wars/get/future-tv'
import { postBleet } from '@/utils/bluesky'
import { sendWebhook } from '@/utils/discord'
import redis, { RedisKey } from '@/utils/redis'

// =================
// TV
// =================

//
// TYPES
//
export type TvShow = {
	series: string
	title: string
	episode: string
	pubDate: Date
	pubString: string
	url: string
}

//
// FORMATTERS
//
const createMessageForDiscord = (tv: TvShow) => {
	const cleanDate = new Date(tv.pubDate)
	cleanDate.setDate(cleanDate.getDate() + 1)
	return `
**${tv.series} (${tv.episode})**
- *Title:* ${tv.title}
- *Release Date*: <t:${cleanDate.getTime() / 1000}:d>
- [*More Info Here*](${tv.url})`
}
const createMessageForBsky = (tv: TvShow) => {
	return `  ${tv.series} (${tv.episode})
  Title: ${tv.title}
#StarWars #TV #NewRelease`
}
const createOutput = (tv: TvShow[]) => {
	return tv.map(c => `	- ${c.series} - ${c.title} - ${c.episode} - ${c.pubDate.toDateString()}`).join('\n')
}

//
// PROCESSOR
//
const processItems = async ({ debug }): Promise<string> => {
	// Basics
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	// Get TV Shows
	const tv = await getTV()
	const outTv = tv.filter(c => {
		const pubDate = new Date(c.pubDate)
		pubDate.setHours(0, 0, 0, 0)
		// log.info({
		// 	type: 'tv',
		// 	title: c.title,
		// 	pubDate,
		// })
		const test = today.getTime() === pubDate.getTime()
		return test
	})

	if (!outTv.length) {
		return '  - No TV shows today'
	}

	try {
		for (const c of outTv) {
			const redisMember = `tv:${c.title}`

			if (debug) {
				continue
			}

			// Discord
			const discordExists = await redis.sismember(RedisKey.Discord, redisMember)
			if (!discordExists) {
				await sendWebhook(
					process.env.DISCORD_WEBHOOK_TV,
					{
						username: `TV Shows Premiering (${today.toDateString()})`,
						content: createMessageForDiscord(c),
						avatar_url: 'https://blueharvest.rocks/bots/bh_teal@2x.png',
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
				log.info(`Bleeting TV show: ${c.title}`)
				await postBleet({ contentType: 'TV Show', title: c.title, items: createMessageForBsky(c), url: c.url })

				await redis.sadd(RedisKey.Bluesky, redisMember)
			} else {
				log.info('+ Redis.bluesky.exists', { redisMember })
			}
		}
	} catch (error) {
		log.error('Error bleeting message', error)
	}

	return createOutput(outTv)
}

export default processItems