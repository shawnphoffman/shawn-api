import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

import { KvPrefix } from '@/utils/kv'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const kvUrl = `${KvPrefix.PodSpotify}:${url}`

	const cachedResponse = (await kv.get(kvUrl)) as any | null
	if (cachedResponse) {
		// console.log('cachedResponse', cachedResponse)
		return NextResponse.json({ vals: cachedResponse, url, cached: true })
	}

	const launchArgs = JSON.stringify({ stealth: true })
	const browser = await puppeteer.connect({
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&launch=${launchArgs}`,
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

		kv.set(kvUrl, JSON.stringify(vals), {
			ex: 60 * 60 * 24 * 3,
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
