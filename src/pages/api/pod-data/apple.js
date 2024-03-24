import * as cheerio from 'cheerio'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
// import corsCheck from './cors'

// const dataUrl = 'https://podcasts.apple.com/us/podcast/jammed-transmissions-a-star-wars-podcast/id1445333816?see-all=reviews'
// https://podcasts.apple.com/us/podcast/id${POD_ID}?see-all=reviews

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

		const pageTitle = $('h1 span:first').text().trim()

		console.log(`Title: ${pageTitle}`)

		const rating = $('.we-customer-ratings__averages__display').text()
		const ratingString = $('.we-customer-ratings__averages').text()

		console.log(`Rating: ${rating}, RatingString: ${ratingString}`)

		// Collect Reviews
		const reviews = $('.we-customer-review')
			.map(function () {
				const title = $(this).find('h3').text().trim()
				const author = $(this).find('.we-customer-review__user').text().trim()
				const date = $(this).find('time').text().trim()
				const text = $(this).find('p').text().trim()
				const stars = $(this).find('figure').attr('aria-label').replace(' out of 5', '')

				return {
					title,
					author,
					date,
					text,
					stars,
				}
			})
			.toArray()

		console.log(`Review Count: ${reviews.length}`)

		const response = {
			rating,
			ratingString,
			ratingsUrl: url,
			reviews,
		}

		res.status(200).send({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		res.status(500).send(error)
	}
}
