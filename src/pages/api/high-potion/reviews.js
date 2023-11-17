import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import * as cheerio from 'cheerio'
import Cors from 'src/utils/cors'

const dataUrl = 'https://podcasts.apple.com/us/podcast/high-potion/id1571377051?see-all=reviews'

export default async function handler(req, res) {
	await Cors(req, res, {
		methods: ['GET', 'OPTIONS'],
		origin: [/myweirdfoot\.com$/, /localhost/],
	})

	const requestOptions = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache(dataUrl, requestOptions, 15)

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
		ratingsUrl: dataUrl,
		reviews,
	}

	res.status(200).send(response)
}
