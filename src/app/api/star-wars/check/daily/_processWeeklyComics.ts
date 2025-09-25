// import { log } from 'next-axiom'

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
	return `<ul>${comics.map(c => `<li>📰 ${c}</li>`).join('')}</ul>`
}

//
// PROCESSOR
//
const processWeeklyComics = async ({ debug }): Promise<string> => {
	let weeklyResp
	try {
		// Get Weekly Comics
		weeklyResp = await getWeeklyComics()
	} catch (err) {
		console.error('Error getting weekly comics', { err })
		return `<i>Error getting weekly comics</i>`
	}

	// Filter Comics
	if (!weeklyResp?.title) {
		return `<i>No weekly comics found</i>`
	}

	const outComics = weeklyResp.comics.reduce((memo, c) => {
		const issues = c.issues.map(i => `  - ${i}`)
		return [...memo, ...issues]
	}, [])

	const redisMember = `weekly-comics:${weeklyResp.title}`

	if (!debug) {
		// // Discord
		// const discordExists = await redis().sismember(RedisKey.Discord, redisMember)
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
		// 	// await redis().sadd(RedisKey.Discord, redisMember)
		// } else {
		// 	console.log('+ Redis.discord.exists', { redisMember })
		// }

		// Bluesky
		const blueskyExists = await redis().sismember(RedisKey.Bluesky, redisMember)
		if (!blueskyExists) {
			console.log(`Bleeting weekly comics for: ${weeklyResp.title}`)

			const count = outComics.length
			const comicsPerBleet = 3
			const bleetCount = Math.ceil(count / comicsPerBleet)
			const isMultiPart = bleetCount > 1

			for (let i = 0; i < bleetCount; i++) {
				const start = i * comicsPerBleet
				const end = start + comicsPerBleet

				const items = formatWeeklyComicsForBsky(weeklyResp.title, outComics.slice(start, end))
				const multiPartTitle = isMultiPart ? ` Part ${i + 1}` : ''
				const title = `Weekly Comics${multiPartTitle}: ${weeklyResp.title} (${start + 1}-${end})`

				// console.log(multiPartTitle, { items, title })

				await postBleetToBsky({
					items,
					title,
				})
			}

			await redis().sadd(RedisKey.Bluesky, redisMember)
		} else {
			console.log('+ Redis.bluesky.exists', { redisMember })
		}
	}

	return createOutput(outComics)
}

export default processWeeklyComics
