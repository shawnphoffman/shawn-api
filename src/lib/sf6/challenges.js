import * as cheerio from 'cheerio'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

const dataUrl = 'https://www.streetfighter.com/6/buckler/reward/challenge'

export const getChallenges = async () => {
	// CHEERIO BOILERPLATE
	const options = {
		method: 'GET',
		headers: {
			Referer: 'https://www.streetfighter.com/6/buckler/point/history',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
			// 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0',
			// Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
			// 'Accept-Language': 'en-US,en;q=0.5',
			// 'Accept-Encoding': 'gzip, deflate, br',
			// Connection: 'keep-alive',
			// 'Upgrade-Insecure-Requests': 1,
			// 'Sec-Fetch-Dest': 'document',
			// 'Sec-Fetch-Mode': 'navigate',
			// 'Sec-Fetch-Site': 'none',
			// 'Sec-Fetch-User': '?1',
			// TE: 'trailers',
		},
	}
	let data
	try {
		data = await fetchHtmlWithCache({ url: dataUrl, options, cacheMinutes: 60 })
	} catch (error) {
		console.log(error)
		return null
	}
	return parseChallenges(data)
}

export const parseChallenges = data => {
	const $ = cheerio.load(data)
	// console.log(data)
	// END CHEERIO BOILERPLATE

	// Challenges List
	const challengesList = $('[class^=challenge_challenge_list]>li')
	// console.log(`Challenges Count: ${challengesList.length}`)

	// Process Challenges
	const challenges = challengesList
		.map(function () {
			const title = $(this).find('h3').text().trim()
			// console.log(`Title: ${title}`)

			const rawDateString = $(this).find('[class^=challenge_end_date]').text().trim()
			// console.log({ rawDateString })
			const cleanDateString = rawDateString.replace('Valid Until：', '').replace(/\(|\)/g, '')
			// console.log({ cleanDateString })
			// NOTE - I hate server dates
			// // const endDate = new Date(cleanDateString)
			// const endDate = new Date(cleanDateString).toLocaleDateString('en-US')
			// // console.log({ endDate })
			// NOTE Try this instead. Who cares
			const endDate = cleanDateString.substring(0, 16)

			// The reward label reads "Kudos × <span>200</span>" in the reward's hover card
			const rewardLabel = $(this).find('[class^=challenge_reward] [class^=challenge_inner] dt').first()
			const item = rewardLabel.clone().children().remove().end().text().replace(/×/g, '').trim()
			const qty = +rewardLabel.find('span').text().trim()
			const reward = {
				item,
				qty: qty,
			}
			// console.log({ reward })

			const rawTasks = $(this).find('[class^=challenge_task] dd li')
			const tasks = rawTasks
				.map(function () {
					// // NOTE This only works in jQuery
					// const style = $(this).css('background')
					// const mode = style.split('_').pop().split('.').shift()

					// TODO Figure out how to do this
					// As of 6/6/23
					// challenge_type3__dK0Uv: Battle Hub
					// challenge_type2__51D_j: World Tour
					// challenge_type1__ZNT3y: Fighting Ground

					// See what happens
					const thisClass = $(this).attr('class')
					const isBH = thisClass.indexOf('challenge_type3') !== -1
					const isWT = thisClass.indexOf('challenge_type2') !== -1
					const isFG = thisClass.indexOf('challenge_type1') !== -1
					const mode = isBH ? 'Battle Hub' : isWT ? 'World Tour' : isFG ? 'Fighting Ground' : 'Unknown'
					// console.log({
					// 	isBH,
					// 	isFG,
					// 	isWT,
					// 	mode
					// })

					return {
						mode,
						description: $(this).text().trim(),
					}
				})
				.toArray()
			// console.log({tasks})

			const temp = {
				title,
				endDate,
				reward,
				tasks,
			}
			// console.log(temp)

			return temp
		})
		.toArray()

	return challenges
}
