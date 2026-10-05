import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

import { hasSpotifyRating, parseSpotifyRatingLabel } from '@/lib/podcast-data/spotify'
import { KvPrefix } from '@/utils/kv'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const kvUrl = `${KvPrefix.PodSpotify}:${url}`

	// A cached value without a rating is a failed scrape, so try again instead of serving it
	const cachedResponse = await kv.get(kvUrl)
	if (hasSpotifyRating(cachedResponse)) {
		return NextResponse.json({ vals: cachedResponse, url, cached: true })
	}

	const browser = await puppeteer.connect({
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&stealth=true&headless=true`,
	})
	try {
		const page = await browser.newPage()
		await page.goto(url, { waitUntil: 'networkidle0' })

		// Spotify's class names change with every build; the test ids and the rating's accessibility label do not
		const found = await page.evaluate(() => {
			const titleEl = document.querySelector('[data-testid="show-title"], [data-testid="entityTitle"] h1')
			const title = (titleEl as HTMLElement | null)?.innerText?.trim() || document.title.replace(/\s*\|\s*Podcast on Spotify$/i, '').trim()
			const ratingLabel = [...document.querySelectorAll('[aria-label]')].map(el => el.getAttribute('aria-label') || '').find(label => /stars?,\s*[\d,.]+K?\s*ratings?/i.test(label))
			return { title, ratingLabel: ratingLabel ?? null }
		})

		const parsed = parseSpotifyRatingLabel(found.ratingLabel)
		if (!parsed) {
			return NextResponse.json({ error: 'No rating found on the Spotify page', url, title: found.title }, { status: 502 })
		}

		const vals = { title: found.title, ...parsed }
		await kv.set(kvUrl, JSON.stringify(vals), {
			ex: 60 * 60 * 24 * 3,
		})

		return NextResponse.json({ vals, url })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
	} finally {
		await browser.close()
	}
}
