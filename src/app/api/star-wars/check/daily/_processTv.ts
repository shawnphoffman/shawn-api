import { log } from 'next-axiom'

import { getAllTv, TvShow } from '@/getters/star-wars/tv'
import { postBleetToBsky } from '@/third-party/bluesky/bluesky'
import { sendDiscordWebhook } from '@/third-party/discord/discord'
import { cleanDate, displayDate, getToday, isSameDate } from '@/utils/dates'
import { getOgImageUrl } from '@/utils/imageUtils'
import redis, { RedisKey } from '@/utils/redis'

// =================
// TV
// =================

//
// FORMATTERS
//
const createMessageForDiscord = (tv: TvShow) => {
	const cleanDate = new Date(tv.pubDate)
	// cleanDate.setDate(cleanDate.getDate() + 1)
	return `
**${tv.series} (${tv.episode})**
- *Title:* ${tv.title}
- *Release Date*: <t:${cleanDate.getTime() / 1000}:d>
- [*More Info Here*](${tv.url})`
}
const createMessageForBsky = (tv: TvShow) => {
	return `  ${tv.series} (${tv.episode})
  Title: ${tv.title}
Release Date: ${displayDate(tv.pubDate)}
#StarWars #TV #NewRelease`
}
const createOutput = (tv: TvShow[]) => {
	return `<ul>${tv.map(c => `<li>📺 ${c.series} - ${c.title} - ${c.episode} - ${displayDate(c.pubDate)}</li>`).join('')}</ul>`
}

//
// PROCESSOR
//
const processItems = async ({ debug }): Promise<string> => {
	// Basics
	const testDate = getToday()
	testDate.setUTCDate(testDate.getUTCDate() - 5)
	testDate.setUTCHours(0, 0, 0, 0)

	// Get TV Shows
	const tv = await getAllTv()
	const outTv = tv.filter(c => {
		const pubDate = cleanDate(c.pubDate)

		// console.log('📺', {
		// 	type: 'tv',
		// 	title: c.title,
		// 	pubDate,
		// })

		// const test = isSameDate(testDate, pubDate)
		const test = pubDate >= testDate && pubDate < new Date()
		return test
	})

	if (!outTv.length) {
		return `<i>No TV shows for "${displayDate(testDate)}"</i>`
	}

	try {
		for (const c of outTv) {
			const redisMember = `tv:${c.title}`
			// TODO Change this to use the link instead

			// console.log('📺', c)

			if (c.title === 'TBA') {
				console.log('🚧 Skipping: TBA Title', c)
				continue
			}

			const imageUrl = await getOgImageUrl(c.url)
			if (!imageUrl) {
				console.log('🚧 Skipping: No Image', c)
				continue
			}

			if (debug) {
				continue
			}

			// Discord
			const discordExists = await redis.sismember(RedisKey.Discord, redisMember)
			if (!discordExists) {
				await sendDiscordWebhook(
					process.env.DISCORD_WEBHOOK_TV,
					{
						username: `TV Shows Premiering`,
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
			// const blueskyExists = await redis.sismember(RedisKey.Bluesky, redisMember)
			// if (!blueskyExists) {
			// 	log.info(`Bleeting TV show: ${c.title}`)
			// 	await postBleetToBsky({ contentType: 'TV Show', title: c.title, items: createMessageForBsky(c), url: c.url })

			// 	await redis.sadd(RedisKey.Bluesky, redisMember)
			// } else {
			// 	log.info('+ Redis.bluesky.exists', { redisMember })
			// }
		}
	} catch (error) {
		log.error('Error bleeting message', error)
	}

	return createOutput(outTv)
}

export default processItems
