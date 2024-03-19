import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import * as cheerio from 'cheerio'

const url = 'https://portal.permit.pcta.org/availability/mexican-border.php'
const validMonths = ['3', '4', '5']
const regexp = /\{([^;]+)\}/gi

export default async function handler(req, res) {
	const requestOptions = {
		method: 'GET',
	}
	const page = await fetchHtmlWithCache(url, requestOptions, 10)

	const $ = cheerio.load(page)

	var inlineScript = $($('body script').get()[0]).text()

	var rawData = inlineScript.match(regexp)[0]

	var data = JSON.parse(rawData)

	const dailyLimit = data.limit

	console.log(`Limit: ${dailyLimit}`)

	const variations = data.calendar.filter(e => e.num.toString() != `${dailyLimit}` && validMonths.includes(e.start_date[6]))
	const cleaned = variations.map(e => `${e.start_date}: ${e.num}`)

	const openingsExist = variations.length > 0

	const response = {
		cleaned,
		// cleanedString: JSON.stringify(cleaned, null, 2),
		cleanedHtml: openingsExist ? arrayToHtmlList(cleaned) : '',
		// openings: variations,
		// openingsString: JSON.stringify(variations, null, 2),
		openingsExist,
		dailyLimit: dailyLimit,
	}

	res.status(200).send(response)
}

const arrayToHtmlList = arr => {
	const list = arr.map(a => `<li>${a}</li>`)
	return `<ul>${list.join('')}</ul>`
}
