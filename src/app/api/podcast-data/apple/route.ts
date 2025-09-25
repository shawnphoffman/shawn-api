import { kv } from '@vercel/kv'
import * as cheerio from 'cheerio'
import { NextRequest, NextResponse } from 'next/server'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import { KvPrefix } from '@/utils/kv'

export const dynamic = 'force-dynamic'

// https://podcasts.apple.com/us/podcast/jammed-transmissions-a-star-wars-podcast/id1445333816?see-all=reviews
// https://podcasts.apple.com/us/podcast/id${POD_ID}?see-all=reviews

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const kvUrl = `${KvPrefix.PodApple}:${url}`

	const cachedResponse = (await kv.get(kvUrl)) as any | null
	if (cachedResponse) {
		// console.log('cachedResponse', cachedResponse)
		return NextResponse.json({ ...cachedResponse, url, cached: true })
	}

	try {
		const options = {
			method: 'GET',
		}
		const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 60 })

		const $ = cheerio.load(data)

		// const pageTitle = $('h1 span:first').text().trim()

		// console.log(`Title: ${pageTitle}`)

		// const rating = $('.we-customer-ratings__averages__display').text()
		const ratingRaw = $('.stats div:first').text()
		let rating: string | undefined
		if (ratingRaw) {
			try {
				rating = parseFloat(ratingRaw)?.toFixed(1)
			} catch {}
		}
		// const ratingString = $('.we-customer-ratings__averages').text()
		const ratingString = $('.stats').text()
		const ratingCount = $('.numbers__count').text()?.replace(' Ratings', '')

		console.log(`Rating: ${rating}, RatingString: ${ratingString}`)

		// Collect Reviews
		// const reviews = $('.we-customer-review')
		const reviews = $('.review')
			.map(function () {
				const title = $(this).find('h3').text().trim()
				const author = $(this).find($('.author')).text().trim()
				const date = $(this).find($('.date')).text().trim()
				const text = $(this).find($('.content')).text().trim()
				const stars = $(this).find($('.star')).length

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
			ratingCount,
			rating,
			ratingString,
			ratingsUrl: url,
			reviews,
		}

		kv.set(kvUrl, JSON.stringify(response), {
			ex: 60 * 60 * 24 * 3,
		})

		return NextResponse.json({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	}
}
