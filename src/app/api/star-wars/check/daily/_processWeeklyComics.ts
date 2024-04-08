import { log } from 'next-axiom'

import { getWeeklyComics } from '@/getters/star-wars/comics'
import { postBleetToBsky } from '@/third-party/bluesky/bluesky'
// import { sendWebhook } from '@/third-party/discord/discord'
import redis, { RedisKey } from '@/utils/redis'

// =================
// COMICS
// =================

//
// FORMATTERS
//
// const createMessageForDiscord = (comic: Comic) => {
// 	return `
// **${comic.title}**
// [More Info Here](${comic.url})`
// }
const formatWeeklyComicsForBsky = (title: string, comics: any[]) => {
	return `Star Wars ${title}
${comics.map(c => c).join('\n')}
#StarWars #Comics #NewReleases`
}
const createOutput = (comics: any[]) => {
	return comics.map(c => c).join('\n')
}

//
// PROCESSOR
//
const processWeeklyComics = async ({ debug }): Promise<string> => {
	// Get Weekly Comics
	const weeklyResp = await getWeeklyComics()

	// Filter Comics
	if (!weeklyResp?.title) {
		return `  - No weekly comics found`
	}

	const outComics = weeklyResp.comics.reduce((memo, c) => {
		const issues = c.issues.map(i => `  - ${i}`)
		return [...memo, ...issues]
	}, [])

	const redisMember = `weekly-comics:${weeklyResp.title}`

	if (!debug) {
		// // Discord
		// const discordExists = await redis.sismember(RedisKey.Discord, redisMember)
		// if (!discordExists) {
		// 	// await sendWebhook(
		// 	// 	process.env.DISCORD_WEBHOOK_COMICS,
		// 	// 	{
		// 	// 		username: `Comics Releasing (${displayDate(today)})`,
		// 	// 		content: createMessageForDiscord(c),
		// 	// 		avatar_url: 'https://blueharvest.rocks/bots/bh_blue@2x.png',
		// 	// 	},
		// 	// 	true
		// 	// )
		// 	// await redis.sadd(RedisKey.Discord, redisMember)
		// } else {
		// 	log.info('+ Redis.discord.exists', { redisMember })
		// }

		// Bluesky
		const blueskyExists = await redis.sismember(RedisKey.Bluesky, redisMember)
		if (!blueskyExists) {
			log.info(`Bleeting weekly comics for: ${weeklyResp.title}`)

			await postBleetToBsky({
				items: formatWeeklyComicsForBsky(weeklyResp.title, outComics),
				title: `Weekly Comics: ${weeklyResp.title}`,
			})

			await redis.sadd(RedisKey.Bluesky, redisMember)
		} else {
			log.info('+ Redis.bluesky.exists', { redisMember })
		}
	}

	return createOutput(outComics)
}

export default processWeeklyComics
