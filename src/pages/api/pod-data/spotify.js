import * as cheerio from 'cheerio'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
// import corsCheck from './cors'

function parseRatingString(inputString) {
	const regex = /^(\d+(\.\d+)?)\((\d+)\)$/
	const match = inputString.match(regex)
	if (match) {
		const rating = parseFloat(match[1])
		const ratingCount = parseInt(match[3], 10)
		return {
			rating: rating,
			ratingCount: ratingCount,
		}
	} else {
		return {}
	}
}

export default async function handler(req, res) {
	// corsCheck(req, res)

	const url = req.query?.url

	if (!url) {
		res.status(401).send('URL required')
		return
	}

	try {
		const requestOptions = {
			method: 'GET',
		}
		const data = await fetchHtmlWithCache(url, requestOptions, 15)

		const $ = cheerio.load(data)

		const pageTitle = $('h1').text().trim()

		console.log(`Title: ${pageTitle}`)

		const roughRating = $('[data-testid="rating-and-topics"] button:first').text()
		console.log(`Rough Heading: ${roughRating}`)

		const response = parseRatingString(roughRating)

		res.status(200).send({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		res.status(500).send(error)
	}
}
