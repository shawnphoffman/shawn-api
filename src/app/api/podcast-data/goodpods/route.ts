import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

export const dynamic = 'force-dynamic'

// Source URL
// https://goodpods.com/podcasts/dinner-with-the-heelers-a-bluey-podcast-277737

// API - Needs Auth
// https://v2.goodpods.com/podcast/details?podcastId=277737

// Images
// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top1_week.avif
// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top3_month.avif
// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_all-leisure_top50_month.avif
// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_all-leisure_top50_month.png

const url = 'https://goodpods.com/podcasts/dinner-with-the-heelers-a-bluey-podcast-277737'

export async function GET(_request: Request) {
	// return NextResponse.json({ hello: 'world' })
	try {
		const options = {
			method: 'GET',
		}
		const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 15 })

		console.log('Data:', data)

		const $ = cheerio.load(data)

		// const pageTitle = $('h1').text().trim()

		// console.log(`Title: ${pageTitle}`)

		const leaderboardImage = $('img')
			.map((i, e) => $(e).attr('src'))
			.toArray()

		// const rating = $('.we-customer-ratings__averages__display').text()
		// const ratingString = $('.we-customer-ratings__averages').text()

		// console.log(`Rating: ${rating}, RatingString: ${ratingString}`)

		// // Collect Reviews
		// const reviews = $('.we-customer-review')
		// 	.map(function () {
		// 		const title = $(this).find('h3').text().trim()
		// 		const author = $(this).find('.we-customer-review__user').text().trim()
		// 		const date = $(this).find('time').text().trim()
		// 		const text = $(this).find('p').text().trim()
		// 		const stars = $(this).find('figure').attr('aria-label').replace(' out of 5', '')

		// 		return {
		// 			title,
		// 			author,
		// 			date,
		// 			text,
		// 			stars,
		// 		}
		// 	})
		// 	.toArray()

		// console.log(`Review Count: ${reviews.length}`)

		const response = {
			// rating,
			// ratingString,
			// ratingsUrl: url,
			// reviews,
			leaderboardImage,
		}

		// res.status(200).send({ ...response, url })
		return NextResponse.json({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	}
}
