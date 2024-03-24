import * as cheerio from 'cheerio'
import Cors from 'src/utils/cors'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

const dataUrl = 'https://www.streetfighter.com/6/buckler/event/schedule'

export const getEvents = async () => {
	// CHEERIO BOILERPLATE
	const requestOptions = {
		method: 'GET',
		headers: {
			Referer: 'https://www.streetfighter.com/6/buckler/point/history',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
		},
	}
	let data
	try {
		data = await fetchHtmlWithCache(dataUrl, requestOptions, 60)
	} catch (error) {
		console.log(error)
		return null
	}
	const $ = cheerio.load(data)
	// console.log(data)
	// END CHEERIO BOILERPLATE

	//
	//
	//
	// $("[class*=schedule_today_]")
	// $("[class*=schedule_today_] div[class^=schedule_calendarLine_] p").map(function() { return $(this).text()}).toArray()

	const events = $('[class*=schedule_today_] div[class^=calendar_modal]')
		.map(function () {
			const title = $(this).find('h6').text()
			const desc = $(this).find('p').text()
			console.log({ title, desc })
			return { title, desc }
		})
		.toArray()
	//
	//
	//

	return events

	// // Challenges List
	// const challengesList = $('[class^=challenge_challenge_list]>li')
	// // console.log(`Challenges Count: ${challengesList.length}`)

	// // Process Challenges
	// const challenges = challengesList
	// 	.map(function () {
	// 		const title = $(this).find('h3').text().trim()
	// 		// console.log(`Title: ${title}`)

	// 		const temp = {
	// 			title,
	// 		}
	// 		// console.log(temp)

	// 		return temp
	// 	})
	// 	.toArray()

	// return challenges
}

export default async function handler(req, res) {
	await Cors(req, res, {
		methods: ['GET', 'OPTIONS'],
		// origin: [/blueharvest\.rocks$/, /myweirdfoot\.com$/, /localhost/],
	})

	const events = await getEvents()

	if (!events) {
		return res.status(400).text('Broken')
	}

	res.status(200).send(events)
}
