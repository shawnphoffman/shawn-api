import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'

// Source URL
// https://goodpods.com/podcasts/dinner-with-the-heelers-a-bluey-podcast-277737

// API - Needs Auth
// https://v2.goodpods.com/podcast/details?podcastId=277737

// Images
// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top1_week.avif
// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top3_month.avif
// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_all-leisure_top50_month.avif
// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_all-leisure_top50_month.png

// const url = 'https://goodpods.com/podcasts/dinner-with-the-heelers-a-bluey-podcast-277737'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	try {
		const res = await fetch(url, {
			next: {
				revalidate: 60 * 15,
			},
		})
		const data = await res.text()

		// console.log('Data:', data)

		const $ = cheerio.load(data)

		const matchingImages = $('img').filter(function () {
			return Boolean($(this).attr('alt') && $(this).attr('alt')!.toLowerCase().includes('star filled'))
		})

		if (matchingImages.length === 0) {
			return {
				error: 'No matching images found',
			}
		}

		const mainStar = matchingImages[0]
		// console.log('Star: ', $(mainStar).attr('src'))

		const mainSiblings = $(mainStar).siblings()
		// console.log('Sibling: ', $(mainSiblings).text())

		const parsedRatingNumber = parseFloat($(mainSiblings)?.text())

		if (isNaN(parsedRatingNumber)) {
			return NextResponse.json(
				{
					error: {
						message: 'No rating found',
						url,
					},
				},
				{ status: 500 }
			)
		}

		const response = {
			rating: parsedRatingNumber,
		}

		return NextResponse.json({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	}
}
