import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

// function parseRatingString(inputString: string) {
// 	const regex = /^(\d+(\.\d+)?)\((\d+)\)$/
// 	const match = inputString.match(regex)
// 	if (match) {
// 		const rating = parseFloat(match[1])
// 		const ratingCount = parseInt(match[3], 10)
// 		return {
// 			rating: rating,
// 			ratingCount: ratingCount,
// 		}
// 	} else {
// 		return {}
// 	}
// }y

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const browser = await puppeteer.connect({
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}`,
	})
	try {
		const page = await browser.newPage()
		await page.goto(url, { waitUntil: 'networkidle0' })

		const vals = await page.evaluate(() => {
			// @ts-ignore
			const btnVals = [...document.querySelectorAll('button._yl4tOZxcpoUt28k6B8I span')] as HTMLElement[]
			console.log('btnVals.length', btnVals.length)
			const [rating, reviews] = btnVals.map(x => {
				console.log('btnVals.x', x?.innerText)
				return x?.innerText
			})

			// @ts-ignore
			const title = document.querySelector('h1').innerText

			return {
				title,
				rating,
				reviews,
			}
		})

		return NextResponse.json({ vals, url })
		// return NextResponse.json({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	} finally {
		console.log('closing browser')
		await browser.close()
	}
}
