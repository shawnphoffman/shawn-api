import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import * as cheerio from 'cheerio'
import Cors from 'src/utils/cors'

function parseRatingString(inputString) {
	const regex = /^(\d+)\((\d+)\)$/
	const match = inputString.match(regex)
	if (match) {
		const rating = parseInt(match[1], 10)
		const ratingCount = parseInt(match[2], 10)
		return {
			rating: rating,
			ratingCount: ratingCount,
		}
	} else {
		return {}
	}
}

export default async function handler(req, res) {
	await Cors(req, res, {
		methods: ['GET', 'OPTIONS'],
		origin: [/justshillin\.com$/, /localhost/],
	})

	const url = req.query?.url

	if (!url) {
		res.status(401).send('URL required')
		return
	}

	const requestOptions = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache(url, requestOptions, 15)

	const $ = cheerio.load(data)

	// const pageTitle = $('h1').text().trim()

	// console.log(`Title: ${pageTitle}`)

	const roughRating = $('[data-testid="rating-and-topics"] button:first').text()
	// console.log(`Rough Heading: ${roughRating}`)

	const response = parseRatingString(roughRating)

	res.status(200).send({ ...response, url })
}
