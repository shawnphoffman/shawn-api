import { kv } from '@vercel/kv'
import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

import { KvPrefix } from '@/utils/kv'

import { ScrapeError, ScrapeResult, scrapeUrl } from './scrape'

const CACHE_SECONDS = 60 * 10

// Callers send `Authorization: Bearer $SCRAPE_SECRET`. Fails closed when the
// secret is not configured, since this endpoint drives a browser at home.
function isAuthorized(request: Request): boolean {
	const secret = process.env.SCRAPE_SECRET
	if (!secret) return false
	const provided = Buffer.from(request.headers.get('authorization') || '')
	const expected = Buffer.from(`Bearer ${secret}`)
	return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export async function handleScrape(request: Request) {
	if (!process.env.SCRAPE_SECRET) {
		return NextResponse.json({ error: 'not_configured', message: 'SCRAPE_SECRET is not configured' }, { status: 500 })
	}
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: 'unauthorized', message: 'Missing or invalid Authorization header' }, { status: 401 })
	}

	const url = new URL(request.url).searchParams.get('url')
	if (!url) {
		return NextResponse.json({ error: 'invalid_url', message: 'url query param is required' }, { status: 400 })
	}

	const kvKey = `${KvPrefix.ScrapeResult}:${url}`

	try {
		const cached = await kv.get<ScrapeResult>(kvKey)
		if (cached) {
			return NextResponse.json({ ...cached, cached: true })
		}
	} catch (error) {
		console.log('Scrape cache read failed:', error)
	}

	try {
		const result = await scrapeUrl(url)
		try {
			await kv.set(kvKey, result, { ex: CACHE_SECONDS })
		} catch (error) {
			console.log('Scrape cache write failed:', error)
		}
		return NextResponse.json(result)
	} catch (error) {
		if (error instanceof ScrapeError) {
			console.log(`Scrape failed (${error.code}) for ${url}: ${error.message}`)
			return NextResponse.json({ error: error.code, message: error.message }, { status: error.status })
		}
		console.log('Scrape error:', error)
		return NextResponse.json({ error: 'unknown', message: error instanceof Error ? error.message : String(error) }, { status: 500 })
	}
}
