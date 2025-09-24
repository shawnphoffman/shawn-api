import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'

import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

export const dynamic = 'force-dynamic'

function parseRatingString(inputString: string) {
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

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	try {
		const options = {
			method: 'GET',
		}
		const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 60 })

		const $ = cheerio.load(data)

		// const pageTitle = $('h1').text().trim()

		// console.log(`Title: ${pageTitle}`)

		const roughRating = $('[data-testid="rating-and-topics"] button:first').text()
		// console.log(`Rough Heading: ${roughRating}`)

		const response = parseRatingString(roughRating)

		// res.status(200).send({ ...response, url })
		return NextResponse.json({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	}
}
